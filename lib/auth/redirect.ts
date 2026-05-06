const LOCAL_ORIGIN = 'http://local.test'

export function getSafeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null

  try {
    const parsed = new URL(value, LOCAL_ORIGIN)
    if (parsed.origin !== LOCAL_ORIGIN) return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export function getInternalPathFromUrl(value: string | null | undefined): string | null {
  if (!value) return null

  try {
    const parsed = new URL(value)
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return getSafeInternalPath(value)
  }
}
