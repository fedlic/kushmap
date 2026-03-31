import type { Metadata } from 'next'
import PremiumLandingPage from '@/components/premium/PremiumLandingPage'

export const metadata: Metadata = {
  title: 'Premium Listing - KUSHMAP',
  description: 'Get your dispensary featured on KUSHMAP. Priority placement, FEATURED badge, and social media promotion.',
}

export default function PremiumPage() {
  return <PremiumLandingPage />
}
