import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfilePage from '@/components/profile/ProfilePage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プロフィール | KUSHMAP',
}

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  return <ProfilePage user={user} />
}
