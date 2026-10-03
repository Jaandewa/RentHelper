import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== "provider" && session.user.role !== "admin")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    });

    if (!business) {
      return NextResponse.json({
        grossRentalValue: 0,
        rentalPaymentsReceived: 0,
        outstandingBalance: 0,
        depositsHeld: 0,
        depositsRefunded: 0,
        depositDeductions: 0,
        confirmedBookings: 0,
        activeRentals: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        monthlyRevenue: [],
        topItems: []
      });
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let dateFilter: Prisma.DateTimeFilter | undefined = undefined;
    if (dateFrom || dateTo) {
      dateFilter = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
    }

    const [
      grossRentalValueAgg,
      rentalPaymentsAgg,
      outstandingAgg,
      depositsHeldAgg,
      depositSettlementAgg,
      bookingsByStatus,
      paymentsLast12Months,
      allBookingItems
    ] = await Promise.all([
      prisma.booking.aggregate({
        where: { 
          businessId: business.id, 
          status: { in: ['confirmed', 'active', 'completed', 'returned_pending_settlement'] },
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        _sum: { totalAmount: true }
      }),
      prisma.payment.aggregate({
        where: { 
          booking: { businessId: business.id }, 
          type: { in: ['advance', 'balance'] },
          ...(dateFilter ? { paidAt: dateFilter } : {})
        },
        _sum: { amount: true }
      }),
      prisma.booking.aggregate({
        where: { 
          businessId: business.id, 
          status: { in: ['confirmed', 'active'] },
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        _sum: { balanceDue: true }
      }),
      prisma.booking.aggregate({
        where: { 
          businessId: business.id, 
          status: 'active',
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        _sum: { depositAmount: true }
      }),
      prisma.depositSettlement.aggregate({
        where: { 
          booking: { 
            businessId: business.id,
            ...(dateFilter ? { createdAt: dateFilter } : {})
          }
        },
        _sum: { refundAmount: true, deductionAmount: true }
      }),
      prisma.booking.groupBy({
        by: ['status'],
        where: { 
          businessId: business.id,
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        _count: { _all: true }
      }),
      prisma.payment.findMany({
        where: {
          booking: { businessId: business.id },
          type: { in: ['advance', 'balance'] },
          paidAt: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        },
        select: { amount: true, paidAt: true }
      }),
      prisma.bookingItem.findMany({
        where: { 
          booking: { 
            businessId: business.id,
            ...(dateFilter ? { createdAt: dateFilter } : {})
          } 
        },
        select: {
          itemTotal: true,
          item: {
            select: { name: true }
          }
        }
      })
    ]);

    let confirmedBookings = 0;
    let activeRentals = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    for (const group of bookingsByStatus) {
      const count = group._count?._all || 0;
      if (group.status === 'confirmed') confirmedBookings += count;
      if (group.status === 'active') activeRentals += count;
      if (group.status === 'completed') completedBookings += count;
      if (group.status === 'cancelled' || group.status === 'rejected_by_provider') cancelledBookings += count;
    }

    const monthlyRevenueMap: Record<string, number> = {};
    for (const p of paymentsLast12Months) {
      const month = p.paidAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + p.amount;
    }
    const monthlyRevenue = Object.entries(monthlyRevenueMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const itemStatsMap: Record<string, { name: string, bookings: number, revenue: number }> = {};
    for (const bi of allBookingItems) {
      const name = bi.item?.name || 'Unknown Item';
      if (!itemStatsMap[name]) {
        itemStatsMap[name] = { name, bookings: 0, revenue: 0 };
      }
      itemStatsMap[name].bookings += 1;
      itemStatsMap[name].revenue += bi.itemTotal;
    }
    const topItems = Object.values(itemStatsMap)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);

    return NextResponse.json({
      grossRentalValue: grossRentalValueAgg._sum?.totalAmount || 0,
      rentalPaymentsReceived: rentalPaymentsAgg._sum?.amount || 0,
      outstandingBalance: outstandingAgg._sum?.balanceDue || 0,
      depositsHeld: depositsHeldAgg._sum?.depositAmount || 0,
      depositsRefunded: depositSettlementAgg._sum?.refundAmount || 0,
      depositDeductions: depositSettlementAgg._sum?.deductionAmount || 0,
      confirmedBookings,
      activeRentals,
      completedBookings,
      cancelledBookings,
      monthlyRevenue,
      topItems
    });
  } catch (error) {
    console.error("Error in /api/provider/finance", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
