import type { ApiSuccessResponse, ReviewItem, ReviewsQuery, ServiceReview } from '~/types/api'
import { useApiClient } from './client'

export function mapServiceReviewToItem(review: ServiceReview): ReviewItem {
  const author = review.author
  const fullName = [author.first_name, author.last_name].filter(Boolean).join(' ')
  const name = fullName || author.name || author.nik || 'Гость'

  return {
    id: review.id,
    name,
    role: author.bio || '',
    text: review.content,
    rating: Number(review.rate_number) || 0,
    ratingText: review.rate_text || '',
    avatar: author.avatar_url || undefined,
  }
}

export function useReviewsApi() {
  const { apiFetch } = useApiClient()

  function getReviews(params: ReviewsQuery) {
    return apiFetch<ApiSuccessResponse<ServiceReview[]>>('/services/reviews', {
      method: 'POST',
      body: params,
    })
  }

  async function getReviewItems(params: ReviewsQuery) {
    const response = await getReviews(params)

    if (!response.success) {
      return []
    }

    return response.data.map(mapServiceReviewToItem)
  }

  return {
    getReviews,
    getReviewItems,
  }
}
