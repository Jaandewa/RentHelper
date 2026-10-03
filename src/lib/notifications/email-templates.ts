const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rent.healingcity.lk';

function getTemplateWrapper(title: string, bodyContent: string, ctaUrl?: string, ctaText?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(to right, #2563eb, #4338ca); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; color: #374151; font-size: 16px; line-height: 1.6;">
              ${bodyContent}
              ${ctaUrl && ctaText ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${ctaUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">${ctaText}</a>
              </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">&copy; ${new Date().getFullYear()} RentHelper. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function renderEmailTemplate(eventType: string, vars: Record<string, any>): { subject: string; html: string; text: string } | null {
  switch (eventType) {
    case 'KYC_APPROVED':
      return {
        subject: 'Your KYC verification was approved',
        html: getTemplateWrapper(
          'KYC Approved',
          `<p>Hi ${vars.customerName},</p><p>Great news! Your KYC verification has been approved. You are now ready to start renting items on RentHelper.</p>`,
          `${BASE_URL}/rentals`,
          'Browse Rentals'
        ),
        text: `Hi ${vars.customerName},\n\nGreat news! Your KYC verification has been approved. You can now start renting.\n\nBrowse rentals: ${BASE_URL}/rentals`
      };
    
    case 'KYC_REJECTED':
      return {
        subject: 'Your KYC verification needs attention',
        html: getTemplateWrapper(
          'KYC Update Needed',
          `<p>Hi ${vars.customerName},</p><p>We couldn't approve your KYC submission for the following reason:</p><p style="padding: 15px; background-color: #fee2e2; color: #991b1b; border-radius: 6px;">${vars.rejectionReason}</p><p>Please update your details and submit again.</p>`,
          `${BASE_URL}/profile/kyc`,
          'Update KYC'
        ),
        text: `Hi ${vars.customerName},\n\nWe couldn't approve your KYC submission for the following reason:\n${vars.rejectionReason}\n\nPlease update your details and submit again: ${BASE_URL}/profile/kyc`
      };

    case 'BOOKING_REQUESTED':
    case 'NEW_BOOKING_REQUEST':
      return {
        subject: `New booking request — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'New Booking Request',
          `<p>Hi ${vars.providerName},</p><p><strong>${vars.customerName}</strong> has requested to book your <strong>${vars.itemName}</strong>.</p><p><strong>Pickup:</strong> ${vars.pickupDateTime}<br><strong>Return:</strong> ${vars.returnDateTime}<br><strong>Rental Total:</strong> Rs. ${vars.rentalTotal}</p>`,
          `${BASE_URL}/provider/bookings/${vars.bookingId}`,
          'View Booking'
        ),
        text: `Hi ${vars.providerName},\n\n${vars.customerName} has requested to book your ${vars.itemName}.\nPickup: ${vars.pickupDateTime}\nReturn: ${vars.returnDateTime}\nTotal: Rs. ${vars.rentalTotal}\n\nView Booking: ${BASE_URL}/provider/bookings/${vars.bookingId}`
      };

    case 'BOOKING_ACCEPTED':
      return {
        subject: `Your booking request was accepted — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'Booking Accepted',
          `<p>Hi ${vars.customerName},</p><p>Your request to book <strong>${vars.itemName}</strong> has been accepted by ${vars.providerName}.</p><p><strong>Pickup:</strong> ${vars.pickupDateTime}<br><strong>Return:</strong> ${vars.returnDateTime}</p>${vars.advanceRequired ? '<p>Please complete your advance payment to confirm the booking.</p>' : ''}`,
          `${BASE_URL}/customer/bookings/${vars.bookingId}`,
          'View Booking'
        ),
        text: `Hi ${vars.customerName},\n\nYour request to book ${vars.itemName} has been accepted by ${vars.providerName}.\nPickup: ${vars.pickupDateTime}\nReturn: ${vars.returnDateTime}\n\n${vars.advanceRequired ? 'Please complete your advance payment to confirm the booking.\n' : ''}View Booking: ${BASE_URL}/customer/bookings/${vars.bookingId}`
      };

    case 'BOOKING_REJECTED':
      return {
        subject: `Booking request update — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'Booking Update',
          `<p>Hi ${vars.customerName},</p><p>Unfortunately, your request to book <strong>${vars.itemName}</strong> was declined by ${vars.providerName}.</p><p><strong>Reason:</strong> ${vars.rejectionReason}</p><p>Don't worry, you can browse other available items.</p>`,
          `${BASE_URL}/rentals`,
          'Browse Other Items'
        ),
        text: `Hi ${vars.customerName},\n\nUnfortunately, your request to book ${vars.itemName} was declined by ${vars.providerName}.\nReason: ${vars.rejectionReason}\n\nBrowse other items: ${BASE_URL}/rentals`
      };

    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_CONFIRMATION':
      return {
        subject: `Payment received — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'Payment Confirmed',
          `<p>Hi ${vars.recipientName},</p><p>We have successfully received a payment of <strong>Rs. ${vars.amountPaid}</strong> on ${vars.paymentDate} for booking ${vars.bookingId}.</p><p>Remaining balance: Rs. ${vars.remainingBalance}</p>`
        ),
        text: `Hi ${vars.recipientName},\n\nWe have successfully received a payment of Rs. ${vars.amountPaid} on ${vars.paymentDate} for booking ${vars.bookingId}.\nRemaining balance: Rs. ${vars.remainingBalance}`
      };

    case 'BOOKING_CONFIRMED_PROVIDER':
      return {
        subject: `Advance payment received — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'Booking Confirmed',
          `<p>Hi ${vars.providerName},</p><p><strong>${vars.customerName}</strong> has paid the advance amount of Rs. ${vars.advancePaid} for <strong>${vars.itemName}</strong>.</p><p>The booking is now confirmed. Please prepare the item for handover.</p>`,
          `${BASE_URL}/provider/bookings/${vars.bookingId}`,
          'View Booking'
        ),
        text: `Hi ${vars.providerName},\n\n${vars.customerName} has paid the advance amount of Rs. ${vars.advancePaid} for ${vars.itemName}.\nThe booking is now confirmed. Please prepare the item for handover.\n\nView Booking: ${BASE_URL}/provider/bookings/${vars.bookingId}`
      };

    case 'ITEM_HANDED_OVER':
      return {
        subject: `Your rental has started — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'Rental Started',
          `<p>Hi ${vars.customerName},</p><p>You have successfully picked up <strong>${vars.itemName}</strong> from ${vars.providerName}.</p><p><strong>Pickup Time:</strong> ${vars.pickupDateTime}<br><strong>Return Due:</strong> ${vars.returnDateTime}</p><p>Enjoy your rental!</p>`,
          `${BASE_URL}/customer/bookings/${vars.bookingId}`,
          'View Booking'
        ),
        text: `Hi ${vars.customerName},\n\nYou have successfully picked up ${vars.itemName} from ${vars.providerName}.\nPickup: ${vars.pickupDateTime}\nReturn Due: ${vars.returnDateTime}\n\nView Booking: ${BASE_URL}/customer/bookings/${vars.bookingId}`
      };

    case 'RETURN_COMPLETED':
      return {
        subject: `Rental return completed — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'Return Completed',
          `<p>Hi ${vars.recipientName},</p><p>The rental for <strong>${vars.itemName}</strong> has been successfully returned.</p><p>Thank you for using RentHelper!</p>`
        ),
        text: `Hi ${vars.recipientName},\n\nThe rental for ${vars.itemName} has been successfully returned.\nThank you for using RentHelper!`
      };

    case 'DEPOSIT_REFUNDED':
      return {
        subject: `Security deposit settlement — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'Deposit Refunded',
          `<p>Hi ${vars.customerName},</p><p>Your security deposit of <strong>Rs. ${vars.refundAmount}</strong> for booking ${vars.bookingId} has been successfully refunded.</p><p>Refund Method: ${vars.refundMethod}</p>`
        ),
        text: `Hi ${vars.customerName},\n\nYour security deposit of Rs. ${vars.refundAmount} for booking ${vars.bookingId} has been successfully refunded.\nRefund Method: ${vars.refundMethod}`
      };

    case 'DEPOSIT_DEDUCTION_APPLIED':
      return {
        subject: `Security deposit settlement — ${vars.bookingId}`,
        html: getTemplateWrapper(
          'Deposit Settled',
          `<p>Hi ${vars.customerName},</p><p>We have processed the security deposit for your recent rental.</p><p><strong>Deduction:</strong> Rs. ${vars.deductionAmount}<br><strong>Reason:</strong> ${vars.deductionReason}<br><strong>Refunded Amount:</strong> Rs. ${vars.refundAmount}</p>`
        ),
        text: `Hi ${vars.customerName},\n\nWe have processed the security deposit for your recent rental.\nDeduction: Rs. ${vars.deductionAmount}\nReason: ${vars.deductionReason}\nRefunded Amount: Rs. ${vars.refundAmount}`
      };

    case 'PROVIDER_WHATSAPP_CHANGED':
      return {
        subject: 'Security Alert: Your Provider WhatsApp Contact Number Was Changed',
        html: getTemplateWrapper(
          'WhatsApp Contact Number Changed',
          `<p>Hi ${vars.providerName || 'Provider'},</p><p>Your RentHelper provider WhatsApp contact number was updated to <strong>${vars.maskedPhone || 'your new number'}</strong>.</p><p style="padding: 15px; background-color: #fef3c7; color: #92400e; border-radius: 6px;">If you did not perform this action, please contact support immediately to secure your account.</p>`,
          `${BASE_URL}/dashboard/settings`,
          'Manage Business Settings'
        ),
        text: `Hi ${vars.providerName || 'Provider'},\n\nYour RentHelper provider WhatsApp contact number was updated to ${vars.maskedPhone || 'your new number'}.\n\nIf you did not perform this action, please contact support immediately.\n\nManage Settings: ${BASE_URL}/dashboard/settings`
      };

    default:
      return null;
  }
}

