import { redirect } from 'next/navigation'
import { getVerifiedProviderContext } from '@/lib/provider-guard'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side Node runtime authorization boundary
  const ctx = await getVerifiedProviderContext()

  if (!ctx.ok) {
    redirect(ctx.redirectUrl)
  }

  return <DashboardShell>{children}</DashboardShell>
}
