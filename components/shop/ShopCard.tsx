import { Shop } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin } from 'lucide-react'

interface ShopCardProps {
  shop: Shop
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="h-40 bg-muted" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-base leading-tight">{shop.name}</h3>
          <Badge variant="outline" className="shrink-0">
            {shop.price_range === 1 ? '$' : shop.price_range === 2 ? '$$' : '$$$'}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />
          <span>{shop.city}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">—</span>
        </div>
      </CardContent>
    </Card>
  )
}
