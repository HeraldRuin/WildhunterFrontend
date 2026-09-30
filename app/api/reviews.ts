import type {
  ApiSuccessResponse,
  ReviewItem,
  ReviewRatingOption,
  ReviewsQuery,
  ServiceReview,
  ServiceReviewAuthor,
} from '~/types/api'
import { useApiClient } from './client'

function formatReviewAuthorName(author: ServiceReviewAuthor) {
  const firstName = author.first_name?.trim() ?? ''

  if (!firstName) {
    return 'Охотник'
  }

  return firstName
}

export function mapServiceReviewToItem(review: ServiceReview): ReviewItem {
  const author = review.author
  const name = formatReviewAuthorName(author)

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

  function getRatings() {
    return apiFetch<ApiSuccessResponse<ReviewRatingOption[]>>('/reviews/ratings', {
      method: 'GET',
      skipAuth: true,
    })
  }

  async function getRatingItems() {
    try {
      const response = await getRatings()

      if (!response.success) {
        return []
      }

      return response.data
    }
    catch {
      return []
    }
  }

  return {
    getReviews,
    getReviewItems,
    getRatings,
    getRatingItems,
  }
}
