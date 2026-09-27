export type BookingEligibility = {
  canBook: boolean;
  buttonText: string;
  buttonStyle: string;
  linkTo?: string;
};

export function isCustomerApproved(profile: {
  kycStatus?: string | null;
  accountStatus?: string | null;
}): boolean {
  return (
    profile.kycStatus === 'verified' &&
    (profile.accountStatus === 'active' || !profile.accountStatus)
  );
}

export function getBookingEligibility(session: any, customerProfile?: any): BookingEligibility {
  // Not logged in
  if (!session?.user) {
    return {
      canBook: false,
      buttonText: 'Sign In to Book',
      buttonStyle: 'bg-gray-900 hover:bg-gray-800',
      linkTo: '/auth/signin',
    };
  }

  // Provider or Admin - no booking action
  if (session.user.role === 'provider' || session.user.role === 'admin') {
    return {
      canBook: false,
      buttonText: '',
      buttonStyle: '',
    };
  }

  // Customer - check KYC status
  const kycStatus = customerProfile?.kycStatus || session.user?.kycStatus || 'not_submitted';
  const accountStatus = customerProfile?.accountStatus || 'incomplete';

  if (kycStatus === 'verified' && (accountStatus === 'active' || accountStatus === 'incomplete')) {
    return {
      canBook: true,
      buttonText: 'Book Now',
      buttonStyle: 'bg-blue-600 hover:bg-blue-700',
    };
  }

  if (kycStatus === 'pending') {
    return {
      canBook: false,
      buttonText: 'Verification Pending',
      buttonStyle: 'bg-amber-500 hover:bg-amber-600 cursor-not-allowed',
      linkTo: '/customer/pending-approval',
    };
  }

  if (kycStatus === 'rejected' || kycStatus === 'needs_more_info') {
    return {
      canBook: false,
      buttonText: 'Complete Verification',
      buttonStyle: 'bg-orange-500 hover:bg-orange-600',
      linkTo: '/onboarding/kyc?resubmit=true',
    };
  }

  // not_submitted or unknown
  return {
    canBook: false,
    buttonText: 'Complete Verification First',
    buttonStyle: 'bg-orange-500 hover:bg-orange-600',
    linkTo: '/onboarding/kyc',
  };
}
