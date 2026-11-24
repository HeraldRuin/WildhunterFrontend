import type { BlogFlowBlock } from '~/types/blog-article'
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

export interface BlogFaqItem {
  question: string
  answer: string
}

export type BlogApiBlock =
  | { type: 'text', content: string }
  | { type: 'faq', items: BlogFaqItem[] }

export interface BlogDetail {
  id: number
  title: string
  slug: string
  status: string
  excerpt: string | null
  image_url: string | null
  author_id: number | null
  created_at: string
  updated_at: string
  blocks: BlogApiBlock[]
}

export interface BlogArticle {
  id: number
  slug: string
  title: string
  description: string
  date: string
  image: string
  blocks: BlogFlowBlock[]
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

function mapFaqItems(items: BlogFaqItem[] | null | undefined): BlogFaqItem[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return []
    }

    return [{
      question: typeof item.question === 'string' ? item.question : '',
      answer: typeof item.answer === 'string' ? item.answer : '',
    }]
  })
}

function mapBlogBlock(block: BlogApiBlock): BlogFlowBlock | null {
  switch (block.type) {
    case 'text':
      return {
        type: 'text',
        content: typeof block.content === 'string' ? block.content : '',
      }
    case 'faq':
      return {
        type: 'faq',
        items: mapFaqItems(block.items),
      }
    default: {
      const exhaustive: never = block
      void exhaustive
      return null
    }
  }
}

function articleTextHasImage(blocks: BlogFlowBlock[]): boolean {
  return blocks.some(block => block.type === 'text' && /<img\b/i.test(block.content))
}

function withArticleHeader(
  blocks: BlogFlowBlock[],
  title: string,
  date: string,
  image: string,
): BlogFlowBlock[] {
  const header: BlogFlowBlock[] = [
    { type: 'title', text: title },
    { type: 'date', text: date },
  ]

  // Картинка карточки — та же ширина и отступы, что у фото внутри статьи
  // (ветка image / hero: на всю колонку, снизу 28px). Если фото уже есть
  // в HTML, оставляем его на месте и вторую копию не добавляем.
  if (image && !articleTextHasImage(blocks)) {
    header.push({
      type: 'image',
      variant: 'hero',
      src: image,
      alt: title,
    })
  }

  return [...header, ...blocks]
}

export function mapBlogDetail(blog: BlogDetail): BlogArticle {
  const blocks = (blog.blocks ?? []).flatMap((block) => {
    const mapped = mapBlogBlock(block)
    return mapped ? [mapped] : []
  })
  const title = blog.title.trim()
  const date = formatBlogCardDate(blog.created_at)

  return {
    id: blog.id,
    slug: blog.slug,
    title,
    description: blog.excerpt?.trim() ?? '',
    date,
    image: blog.image_url || '',
    blocks: withArticleHeader(blocks, title, date, blog.image_url?.trim() || ''),
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

  async function getBlog(slug: string) {
    const response = await apiFetch<ApiSuccessResponse<BlogDetail>>(`/blogs/${encodeURIComponent(slug)}`, {
      skipAuth: true,
    })

    return mapBlogDetail(response.data)
  }

  return {
    getBlogs,
    getBlog,
  }
}
