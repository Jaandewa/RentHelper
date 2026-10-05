import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVerifiedProviderAccess } from "@/lib/provider-guard";

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { error, business } = await requireVerifiedProviderAccess();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search");

    const where: any = { booking: { businessId: business.id } };

    if (type) {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.paidAt = {};
      if (dateFrom) where.paidAt.gte = new Date(dateFrom);
      if (dateTo) where.paidAt.lte = new Date(dateTo);
    }

    if (search) {
      where.booking = {
        ...where.booking,
        OR: [
          { bookingNumber: { contains: search, mode: "insensitive" } },
          { customer: { user: { name: { contains: search, mode: "insensitive" } } } }
        ]
      };
    }

    const skip = (page - 1) * limit;

    const [payments, aggregateIn, aggregateOut] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              bookingNumber: true,
              customer: {
                select: {
                  user: {
                    select: { name: true }
                  }
                }
              },
              bookingItems: {
                select: {
                  item: {
                    select: { name: true }
                  }
                },
                take: 1
              }
            }
          }
        }
      }),
      prisma.payment.aggregate({
        where: { ...where, type: { in: ['advance', 'balance', 'deposit'] } },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...where, type: 'refund' },
        _sum: { amount: true }
      })
    ]);

    const mappedPayments = payments.map(p => ({
      id: p.id,
      bookingId: p.bookingId,
      bookingNumber: p.booking.bookingNumber,
      customerName: p.booking.customer?.user?.name || "Unknown",
      itemName: p.booking.bookingItems?.[0]?.item?.name || "Unknown",
      type: p.type,
      amount: p.amount,
      method: p.method,
      reference: p.reference,
      paidAt: p.paidAt.toISOString(),
    }));

    const totalIn = aggregateIn._sum.amount || 0;
    const totalOut = aggregateOut._sum.amount || 0;

    return NextResponse.json({
      payments: mappedPayments,
      totalIn,
      totalOut,
      total: totalIn - totalOut,
      page,
      limit
    });
  } catch (error) {
    console.error("Error in /api/provider/payments", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
