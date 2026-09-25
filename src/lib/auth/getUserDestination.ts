import prisma from '@/lib/prisma'

export async function getUserDestination(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businessProfile: true,
      customerProfile: true,
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

    if (!customer) {
      return '/onboarding/kyc'
    }

    const kycStatus = customer.kycStatus?.toUpperCase()

    if (kycStatus === 'PENDING') {
      return '/customer/pending-approval'
    }

    if (
      kycStatus === 'REJECTED' ||
      kycStatus === 'MORE_INFORMATION_REQUIRED' ||
      kycStatus === 'NEEDS_MORE_INFO'
    ) {
      return '/onboarding/kyc?resubmit=true'
    }

    if (
      kycStatus === 'APPROVED' ||
      kycStatus === 'VERIFIED'
    ) {
      return '/customer/dashboard'
    }

    return '/onboarding/kyc'
  }

  return '/'
}
