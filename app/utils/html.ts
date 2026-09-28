const REMOVABLE_ATTRIBUTES = /\s(?:style|class|face|size|color|bgcolor|width|height|align|valign)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi

const INLINE_TAGS = ['span', 'font', 'b', 'strong', 'i', 'em', 'u', 'a']

const BLOCK_TAG = /<(?:p|div|br|ul|ol|li|h[1-6]|blockquote|table)\b/i

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function plainTextToParagraphHtml(text: string): string {
  return normalizeNewlines(text)
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtmlText(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function unwrapTag(html: string, tag: string): string {
  const openTag = new RegExp(`<${tag}\\b[^>]*>`, 'gi')
  const closeTag = new RegExp(`</${tag}>`, 'gi')
  let result = html
  let previous = ''

  while (result !== previous) {
    previous = result
    result = result.replace(openTag, '').replace(closeTag, '')
  }

  return result
}

export function normalizeRichTextHtml(html: string): string {
  const trimmed = html.trim()

  if (!trimmed) {
    return ''
  }

  const withNewlines = normalizeNewlines(trimmed)

  if (!BLOCK_TAG.test(withNewlines) && withNewlines.includes('\n')) {
    return plainTextToParagraphHtml(withNewlines)
  }

  let result = trimmed
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(REMOVABLE_ATTRIBUTES, '')

  for (const tag of INLINE_TAGS) {
    result = unwrapTag(result, tag)
  }

  return result.trim()
}
