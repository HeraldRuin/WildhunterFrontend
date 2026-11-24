import type { BlogFlowBlock } from '~/types/blog-article'

type FaqItem = { question: string, answer: string }

type FaqSpan = { start: number, end: number, html: string }

const faqTitlePattern = /часто\s+задаваемые\s+вопросы|ответы\s+на\s+частые\s+вопросы|частые\s+вопросы/i

function sectionPattern() {
  return /<section\b[^>]*\bblog-faq\b[^>]*>[\s\S]*?<\/section>/gi
}

function headingPattern() {
  return new RegExp(
    `<h2\\b[^>]*>(?:(?!<\\/h2>)[\\s\\S])*?(?:${faqTitlePattern.source})(?:(?!<\\/h2>)[\\s\\S])*<\\/h2>[\\s\\S]*?(?=<h[12]\\b|$)`,
    'gi',
  )
}

function findFaqSpans(html: string): FaqSpan[] {
  const spans: FaqSpan[] = []

  for (const match of html.matchAll(sectionPattern())) {
    const start = match.index ?? 0
    spans.push({ start, end: start + match[0].length, html: match[0] })
  }

  for (const match of html.matchAll(headingPattern())) {
    const start = match.index ?? 0
    const end = start + match[0].length
    const overlaps = spans.some(span => start < span.end && end > span.start)
    if (!overlaps) {
      spans.push({ start, end, html: match[0] })
    }
  }

  spans.sort((left, right) => left.start - right.start)
  return spans
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, '\'')
}

function unwrapAnswer(html: string): string {
  const trimmed = html.trim()
  const paragraphs = [...trimmed.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim())
  const rest = trimmed.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, '').trim()

  if (!paragraphs.length) {
    return stripTags(trimmed)
  }

  if (!rest) {
    return paragraphs.join('<br><br>')
  }

  return trimmed
}

function parseDetails(html: string): FaqItem[] {
  const items: FaqItem[] = []

  for (const match of html.matchAll(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi)) {
    const question = stripTags(match[1] ?? '')
    const answer = unwrapAnswer(match[2] ?? '')
    if (question && answer) {
      items.push({ question, answer })
    }
  }

  return items
}

function parseHeadings(html: string): FaqItem[] {
  const withoutTitle = html.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/i, '')
  const items: FaqItem[] = []

  for (const match of withoutTitle.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi)) {
    const question = stripTags(match[1] ?? '')
    const answer = unwrapAnswer(match[2] ?? '')
    if (question && answer) {
      items.push({ question, answer })
    }
  }

  return items
}

function parseFaqChunk(html: string): FaqItem[] {
  const fromDetails = parseDetails(html)
  if (fromDetails.length) {
    return fromDetails
  }

  return parseHeadings(html)
}

export function stripBlogFaqSection(html: string): string {
  const spans = findFaqSpans(html).filter(span => parseFaqChunk(span.html).length > 0)
  if (!spans.length) {
    return html
  }

  let result = ''
  let cursor = 0

  for (const span of spans) {
    result += html.slice(cursor, span.start)
    cursor = span.end
  }

  return result + html.slice(cursor)
}

export function liftFaqFromText(html: string): BlogFlowBlock[] {
  const spans = findFaqSpans(html)
  if (!spans.length) {
    return [{ type: 'text', content: html }]
  }

  const blocks: BlogFlowBlock[] = []
  let pending = ''
  let cursor = 0

  for (const span of spans) {
    pending += html.slice(cursor, span.start)
    const items = parseFaqChunk(span.html)

    if (!items.length) {
      pending += span.html
    }
    else {
      if (pending.trim()) {
        blocks.push({ type: 'text', content: pending })
      }
      pending = ''
      blocks.push({ type: 'faq', items })
    }

    cursor = span.end
  }

  pending += html.slice(cursor)
  if (pending.trim()) {
    blocks.push({ type: 'text', content: pending })
  }

  return blocks.length ? blocks : [{ type: 'text', content: html }]
}

export function normalizeBlogBlocks(blocks: BlogFlowBlock[]): BlogFlowBlock[] {
  const hasFaq = blocks.some(block => block.type === 'faq')
  const normalized: BlogFlowBlock[] = []

  for (const block of blocks) {
    if (block.type !== 'text') {
      normalized.push(block)
      continue
    }

    if (hasFaq) {
      const content = stripBlogFaqSection(block.content)
      if (content.trim()) {
        normalized.push({ type: 'text', content })
      }
      continue
    }

    normalized.push(...liftFaqFromText(block.content))
  }

  return normalized
}
