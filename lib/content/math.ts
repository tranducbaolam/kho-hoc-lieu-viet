import katex from 'katex'

const PROTECTED_BLOCK_RE = /<(pre|code)\b[\s\S]*?<\/\1>/gi

function renderFormula(source: string, displayMode: boolean): string {
  try {
    return katex.renderToString(source, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'html',
    })
  } catch {
    return displayMode
      ? `<span class="math-error">\\[${escapeHtml(source)}\\]</span>`
      : `<span class="math-error">\\(${escapeHtml(source)}\\)</span>`
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderMathInText(text: string): string {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, formula: string) => renderFormula(formula.trim(), true))
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, formula: string) => renderFormula(formula.trim(), true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, formula: string) => renderFormula(formula.trim(), false))
}

export function renderMathInHtml(html: string): string {
  const protectedBlocks: string[] = []
  const withPlaceholders = html.replace(PROTECTED_BLOCK_RE, (match) => {
    const token = `__MATH_PROTECTED_${protectedBlocks.length}__`
    protectedBlocks.push(match)
    return token
  })

  const rendered = withPlaceholders
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith('<') ? part : renderMathInText(part)))
    .join('')

  return protectedBlocks.reduce(
    (acc, block, index) => acc.replace(`__MATH_PROTECTED_${index}__`, block),
    rendered
  )
}
