'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  body: z.string().min(10, '10文字以上入力してください').max(1000),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  shopId: string
  onSuccess?: () => void
}

export default function ReviewForm({ shopId, onSuccess }: ReviewFormProps) {
  const [hoveredStar, setHoveredStar] = useState(0)
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, body: '' },
  })

  const rating = watch('rating')

  const onSubmit = async (data: ReviewFormData) => {
    // TODO: submit to Supabase
    console.log('Review submitted:', { shopId, ...data })
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setValue('rating', star)}
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= (hoveredStar || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
      </div>

      <div>
        <Textarea
          {...register('body')}
          placeholder="Write your review..."
          rows={4}
        />
        {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Post Review'}
      </Button>
    </form>
  )
}
