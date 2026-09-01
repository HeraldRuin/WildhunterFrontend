const REMOVABLE_ATTRIBUTES = /\s(?:style|class|face|size|color|bgcolor|width|height|align|valign)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi

const INLINE_TAGS = ['span', 'font', 'b', 'strong', 'i', 'em', 'u', 'a']

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

  let result = trimmed
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(REMOVABLE_ATTRIBUTES, '')

  for (const tag of INLINE_TAGS) {
    result = unwrapTag(result, tag)
  }

  return result.trim()
}
