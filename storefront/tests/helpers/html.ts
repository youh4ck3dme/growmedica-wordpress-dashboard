export function extractMetaContent(html: string, name: string): string | null {
  const match = html.match(
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  )
  if (match) return match[1]
  const alt = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i')
  )
  return alt?.[1] ?? null
}

export function extractHtmlLang(html: string): string | null {
  return html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? null
}
