export default function ShopDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Shop {params.id} — coming soon</p>
    </div>
  )
}
