'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { fetchShop } from '@/lib/supabase/queries'
import ShopDetailPage from '@/components/shop/ShopDetailPage'
import type { Shop } from '@/types'

function ShopPageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    fetchShop(id).then((data) => {
      setShop(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">ショップが見つかりませんでした</p>
      </div>
    )
  }

  return <ShopDetailPage shop={shop} />
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  )
}
