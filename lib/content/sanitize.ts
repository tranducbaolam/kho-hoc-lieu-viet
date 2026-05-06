import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'sup', 'sub',
  'ul', 'ol', 'li',
  'blockquote',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'figure', 'figcaption',
  'img', 'a',
  'code', 'pre',
  'section', 'article', 'aside',
  'div', 'span',
  'details', 'summary',
]

const SAFE_CLASSES = [
  'lesson-content',
  'lesson-theory',
  'lesson-example',
  'lesson-solution',
  'lesson-practice',
  'lesson-note',
  'exam-content',
  'answer-content',
]

const SAFE_STYLE_PROPERTIES = [
  'text-align',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-collapse',
  'vertical-align',
  'width',
  'height',
  'max-width',
]

function safeClassList(value: string | undefined): string | undefined {
  if (!value) return undefined
  const classes = value
    .split(/\s+/)
    .filter((className) => SAFE_CLASSES.includes(className))
  return classes.length ? classes.join(' ') : undefined
}

function normalizeLinkAttribs(tagName: string, attribs: Record<string, string>) {
  if (tagName !== 'a') return attribs
  const next = { ...attribs }
  if (next.target === '_blank') {
    const rel = new Set((next.rel ?? '').split(/\s+/).filter(Boolean))
    rel.add('noopener')
    rel.add('noreferrer')
    next.rel = Array.from(rel).join(' ')
  }
  return next
}

function normalizeClassAttribs(attribs: Record<string, string>) {
  const className = safeClassList(attribs.class)
  if (className) return { ...attribs, class: className }
  const next = { ...attribs }
  delete next.class
  return next
}

export function sanitizeImportedHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': ['class', 'id', 'title', 'style'],
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      th: ['colspan', 'rowspan', 'width', 'height'],
      td: ['colspan', 'rowspan', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
    allowedStyles: {
      '*': SAFE_STYLE_PROPERTIES.reduce<Record<string, RegExp[]>>((acc, property) => {
        acc[property] = [/^[#(),.%\-\w\s]+$/]
        return acc
      }, {}),
    },
    transformTags: {
      '*': (tagName, attribs) => ({
        tagName,
        attribs: normalizeLinkAttribs(tagName, normalizeClassAttribs(attribs)),
      }),
    },
  })
}

export function looksLikeHtml(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content)
}

export function maybeSanitizeHtmlContent(content: string): string {
  return looksLikeHtml(content) ? sanitizeImportedHtml(content) : content
}
