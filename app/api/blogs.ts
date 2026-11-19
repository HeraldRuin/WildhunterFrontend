import type { ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export interface BlogListItem {
  id: number
  title: string
  slug: string
  status: string
  excerpt: string | null
  image_url: string | null
  author_id: number | null
  created_at: string
  updated_at: string
}

export interface BlogCard {
  id: number
  slug: string
  title: string
  date: string
  image: string
}

function formatBlogCardDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)

  if (!match) {
    return ''
  }

  const [, year, month, day] = match

  return `${day}.${month}.${year} г.`
}

export function mapBlogToCard(blog: BlogListItem): BlogCard {
  return {
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    date: formatBlogCardDate(blog.created_at),
    image: blog.image_url || '',
  }
}

export function useBlogsApi() {
  const { apiFetch } = useApiClient()

  async function getBlogs() {
    const response = await apiFetch<ApiSuccessResponse<BlogListItem[]>>('/blogs', {
      skipAuth: true,
    })

    return (response.data ?? []).map(mapBlogToCard)
  }

  return {
    getBlogs,
  }
}
