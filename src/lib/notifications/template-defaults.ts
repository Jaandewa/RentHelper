/**
 * WhatsApp Template Defaults
 * 
 * Default template definitions for all notification events.
 * Used for initial seeding and "Restore Default" functionality.
 */

export const WHATSAPP_EVENT_TYPES = [
  'REGISTRATION_OTP',
  'KYC_APPROVED',
  'KYC_REJECTED',
  'NEW_BOOKING_REQUEST',
  'BOOKING_ACCEPTED',
  'BOOKING_REJECTED',
  'PAYMENT_CONFIRMED',
  'BOOKING_CONFIRMED_PROVIDER',
  'ITEM_HANDED_OVER',
  'REVIEW_SUBMITTED',
  'DEPOSIT_REFUNDED',
  'DEPOSIT_DEDUCTION_APPLIED',
  'PASSWORD_RESET',
] as const

export type WhatsAppEventType = typeof WHATSAPP_EVENT_TYPES[number]

/** Variables allowed per event type — used for validation */
export const EVENT_VARIABLES: Record<WhatsAppEventType, string[]> = {
  REGISTRATION_OTP: ['customerName', 'otpCode', 'expiryMinutes', 'appName', 'supportContact'],
  KYC_APPROVED: ['customerName', 'appName', 'loginUrl', 'supportContact'],
  KYC_REJECTED: ['customerName', 'rejectionReason', 'appName', 'supportContact'],
  NEW_BOOKING_REQUEST: ['providerName', 'customerName', 'customerDisplayId', 'bookingId', 'itemName', 'itemCategory', 'pickupDateTime', 'returnDateTime', 'rentalDuration', 'rentalTotal', 'advanceRequired', 'customerPurpose', 'customerNote', 'providerDashboardUrl', 'supportContact'],
  BOOKING_ACCEPTED: ['customerName', 'bookingId', 'itemName', 'providerName', 'pickupDateTime', 'returnDateTime', 'rentalTotal', 'securityDeposit', 'advanceRequired', 'remainingBalance', 'paymentDeadline', 'paymentUrl', 'supportContact'],
  BOOKING_REJECTED: ['customerName', 'bookingId', 'itemName', 'providerName', 'rejectionReason', 'marketplaceUrl', 'supportContact'],
  PAYMENT_CONFIRMED: ['customerName', 'bookingId', 'itemName', 'providerName', 'amountPaid', 'paymentDate', 'advancePaid', 'remainingBalance', 'securityDeposit', 'bookingStatus', 'bookingDetailsUrl', 'supportContact'],
  BOOKING_CONFIRMED_PROVIDER: ['providerName', 'bookingId', 'customerName', 'customerDisplayId', 'itemName', 'pickupDateTime', 'returnDateTime', 'amountPaid', 'advancePaid', 'remainingBalance', 'providerBookingUrl', 'supportContact'],
  ITEM_HANDED_OVER: ['customerName', 'bookingId', 'itemName', 'providerName', 'pickupDateTime', 'returnDateTime', 'rentalDuration', 'returnInstructions', 'supportContact'],
  REVIEW_SUBMITTED: ['recipientName', 'reviewerName', 'bookingId', 'itemName', 'rating', 'reviewText', 'profileUrl', 'supportContact'],
  DEPOSIT_REFUNDED: ['customerName', 'bookingId', 'itemName', 'providerName', 'securityDeposit', 'refundAmount', 'refundMethod', 'refundReference', 'supportContact'],
  DEPOSIT_DEDUCTION_APPLIED: ['customerName', 'bookingId', 'itemName', 'providerName', 'securityDeposit', 'deductionAmount', 'deductionReason', 'refundAmount', 'settlementStatus', 'supportContact'],
  PASSWORD_RESET: ['appName', 'resetUrl', 'expiryMinutes', 'supportContact'],
}

/** Preview mock values for admin preview */
export const PREVIEW_VALUES: Record<string, string> = {
  customerName: 'Janith Perera',
  providerName: 'SkyFrame',
  bookingId: 'BK-2026-7604',
  itemName: 'Sony A7 IV Camera',
  pickupDateTime: '30 Sep 2026, 06:27 AM',
  returnDateTime: '30 Sep 2026, 10:27 PM',
  rentalTotal: '5,000',
  advanceRequired: '1,500',
  advancePaid: '1,500',
  amountPaid: '1,500',
  remainingBalance: '3,500',
  securityDeposit: '2,000',
  paymentDeadline: '01 Oct 2026, 10:00 PM',
  paymentDate: '30 Sep 2026, 07:00 PM',
  rejectionReason: 'Item not available for the requested dates',
  otpCode: '482917',
  expiryMinutes: '10',
  appName: 'RentHelper',
  loginUrl: 'https://rent.healingcity.lk/auth/signin',
  paymentUrl: 'https://rent.healingcity.lk/customer/bookings/BK-2026-7604/pay-advance',
  marketplaceUrl: 'https://rent.healingcity.lk/marketplace',
  providerDashboardUrl: 'https://rent.healingcity.lk/dashboard/bookings',
  bookingDetailsUrl: 'https://rent.healingcity.lk/customer/bookings/BK-2026-7604',
  providerBookingUrl: 'https://rent.healingcity.lk/dashboard/bookings/BK-2026-7604',
  profileUrl: 'https://rent.healingcity.lk/providers/skyframe',
  supportContact: '+94 77 123 4567',
  customerDisplayId: 'CUST-001',
  itemCategory: 'Cameras',
  rentalDuration: '16 hours',
  customerPurpose: 'Wedding photography',
  customerNote: 'Need extra battery pack',
  bookingStatus: 'Confirmed',
  recipientName: 'SkyFrame',
  reviewerName: 'Janith Perera',
  rating: '5',
  reviewText: 'Excellent service and great equipment quality!',
  returnInstructions: 'Please return to the store at 123 Main Street, Colombo.',
  resetUrl: 'https://rent.healingcity.lk/reset-password?token=example-token',
}

export interface TemplateDefault {
  eventType: WhatsAppEventType
  name: string
  description: string
  messageBody: string
}

export const DEFAULT_TEMPLATES: TemplateDefault[] = [
  {
    eventType: 'REGISTRATION_OTP',
    name: 'Registration OTP',
    description: 'Sent when a customer needs phone verification during registration',
    messageBody: `Hello {customerName},

Your {appName} verification code is: {otpCode}

This code expires in {expiryMinutes} minutes.
Do not share this code with anyone.

Need help? {supportContact}`,
  },
  {
    eventType: 'KYC_APPROVED',
    name: 'KYC Approved',
    description: 'Sent when admin approves customer identity verification',
    messageBody: `Hello {customerName},

Your identity verification has been approved. ✅

You can now log in and make rental requests on {appName}.

{loginUrl}

Need help? {supportContact}`,
  },
  {
    eventType: 'KYC_REJECTED',
    name: 'KYC Rejected',
    description: 'Sent when admin rejects customer identity verification',
    messageBody: `Hello {customerName},

Your identity verification was not approved.

Reason: {rejectionReason}

Please log in to {appName} to review or resubmit your details.

Need help? {supportContact}`,
  },
  {
    eventType: 'NEW_BOOKING_REQUEST',
    name: 'New Booking Request',
    description: 'Sent to provider when a customer submits a booking request',
    messageBody: `Hello {providerName},

You have received a new booking request.

Booking ID: {bookingId}
Customer: {customerName}
Item: {itemName}
Pickup: {pickupDateTime}
Return: {returnDateTime}
Rental total: Rs. {rentalTotal}
Advance required: Rs. {advanceRequired}

Review the request:
{providerDashboardUrl}`,
  },
  {
    eventType: 'BOOKING_ACCEPTED',
    name: 'Booking Accepted',
    description: 'Sent to customer when provider accepts their booking request',
    messageBody: `Hello {customerName},

Your booking request has been accepted. ✅

Booking ID: {bookingId}
Item: {itemName}
Provider: {providerName}
Pickup: {pickupDateTime}
Return: {returnDateTime}

Advance payment required: Rs. {advanceRequired}
Payment deadline: {paymentDeadline}

Pay your advance:
{paymentUrl}`,
  },
  {
    eventType: 'BOOKING_REJECTED',
    name: 'Booking Rejected',
    description: 'Sent to customer when provider rejects their booking request',
    messageBody: `Hello {customerName},

Your booking request was not accepted.

Booking ID: {bookingId}
Item: {itemName}
Provider: {providerName}
Reason: {rejectionReason}

Browse other rental items:
{marketplaceUrl}`,
  },
  {
    eventType: 'PAYMENT_CONFIRMED',
    name: 'Payment Confirmed',
    description: 'Sent to customer when advance payment is received',
    messageBody: `Hello {customerName},

Your payment has been received successfully. ✅

Booking ID: {bookingId}
Item: {itemName}
Provider: {providerName}
Amount paid: Rs. {amountPaid}
Payment date: {paymentDate}
Remaining balance: Rs. {remainingBalance}

Your booking status: {bookingStatus}

View booking details:
{bookingDetailsUrl}`,
  },
  {
    eventType: 'BOOKING_CONFIRMED_PROVIDER',
    name: 'Booking Confirmed (Provider)',
    description: 'Sent to provider when customer pays advance and booking is confirmed',
    messageBody: `Hello {providerName},

Advance payment has been received. The booking is confirmed. ✅

Booking ID: {bookingId}
Customer: {customerName}
Item: {itemName}
Pickup: {pickupDateTime}
Return: {returnDateTime}
Amount paid: Rs. {amountPaid}

View booking:
{providerBookingUrl}`,
  },
  {
    eventType: 'ITEM_HANDED_OVER',
    name: 'Item Handed Over',
    description: 'Sent to customer when provider marks item as handed over',
    messageBody: `Hello {customerName},

Thank you for renting with {providerName}. ✅

Item: {itemName}
Rental period: {pickupDateTime} to {returnDateTime}

Please follow the agreed return instructions. If you need help, contact:
{supportContact}`,
  },
  {
    eventType: 'REVIEW_SUBMITTED',
    name: 'Review Submitted',
    description: 'Sent when a review is submitted for a booking',
    messageBody: `Hello {recipientName},

A review has been submitted for booking {bookingId}.

Item: {itemName}
Rating: {rating}/5
Review: {reviewText}

View your profile:
{profileUrl}`,
  },

  {
    eventType: 'DEPOSIT_REFUNDED',
    name: 'Deposit Refunded',
    description: 'Sent to customer when their security deposit is fully refunded after return',
    messageBody: `Hello {customerName},

Your rental return inspection has been completed. ✅

Booking ID: {bookingId}
Item: {itemName}

Security deposit: Rs. {securityDeposit}
Refund amount: Rs. {refundAmount}
Refund method: {refundMethod}
Reference: {refundReference}

Thank you for renting with {providerName}.`,
  },
  {
    eventType: 'DEPOSIT_DEDUCTION_APPLIED',
    name: 'Deposit Deduction Applied',
    description: 'Sent to customer when deductions are applied to their security deposit',
    messageBody: `Hello {customerName},

Your rental return inspection has been completed.

Booking ID: {bookingId}
Item: {itemName}

Security deposit: Rs. {securityDeposit}
Deduction: Rs. {deductionAmount}
Reason: {deductionReason}
Refund amount: Rs. {refundAmount}
Settlement status: {settlementStatus}

Need help? {supportContact}`,
  },
  {
    eventType: 'PASSWORD_RESET',
    name: 'Password Reset',
    description: 'Sent when a user requests a password reset',
    messageBody: `Hello,

A password reset was requested for your {appName} account.

Please use the link below to reset your password. This link is valid for {expiryMinutes} minutes.

{resetUrl}

If you did not request this, you can ignore this message.
Need help? {supportContact}`,
  },
  {
    eventType: 'PASSWORD_RESET',
    name: 'Password Reset Link',
    description: 'Sent when a user requests a password reset via WhatsApp',
    messageBody: `You requested a password reset for {appName}.

Reset your password using this secure link:
{resetUrl}

This link expires in {expiryMinutes} minutes.
If you did not request this, you can ignore this message.

Need help? {supportContact}`,
  },
]
