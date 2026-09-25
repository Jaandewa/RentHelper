import prisma from '@/lib/prisma'

export async function getUserDestination(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businessProfile: true,
      customerProfile: {
        include: {
          customerDocuments: true,
        },
      },
    },
  })

  if (!user) return '/'

  const role = user.role?.toUpperCase()

  if (role === 'ADMIN') {
    return '/admin'
  }

  if (role === 'PROVIDER') {
    return user.businessProfile ? '/dashboard' : '/onboarding/business'
  }

  if (role === 'CUSTOMER') {
    const customer = user.customerProfile

    // Brand new user without a customer profile ->fill KYC form
    if (!customer) {
      return '/onboarding/kyc'
    }

    const kycStatus = customer.kycStatus?.toUpperCase()
    const accountStatus = customer.accountStatus?.toUpperCase()

    // Approved customer -> dashboard
    if (
      kycStatus === 'APPROVED' ||
      kycStatus === 'VERIFIED' ||
      accountStatus === 'ACTIVE'
    ) {
      return '/customer/dashboard'
    }

    // Rejected / needs more info customer -> KYC form with resubmit flag
    if (
      kycStatus === 'REJECTED' ||
      kycStatus === 'MORE_INFORMATION_REQUIRED' ||
      kycStatus === 'NEEDS_MORE_INFO' ||
      accountStatus === 'REJECTED'
    ) {
      return '/onboarding/kyc?resubmit=true'
    }

    // Check if KYC form was actually submitted
    const hasSubmitted =
      customer.kycSubmittedAt !== null ||
      (customer.customerDocuments && customer.customerDocuments.length > 0)

    // Pending ONLY if KYC was actually submitted and is pending review
    if (
      kycStatus === 'PENDING' &&
      hasSubmitted &&
      (accountStatus === 'PENDING_APPROVAL' || !accountStatus || accountStatus === 'INCOMPLETE')
    ) {
      return '/customer/pending-approval'
    }

    // Any new, incomplete, or unsubmitted customer profile -> KYC onboarding form
    return '/onboarding/kyc'
  }

  return '/'
}
