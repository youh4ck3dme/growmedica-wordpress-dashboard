import { buildHreflangLinks } from '@/lib/seo'

interface HreflangLinksProps {
  pathname: string
}

/** Explicit hreflang <link> tags — Next.js Metadata API strips ?lang= on root path. */
export function HreflangLinks({ pathname }: HreflangLinksProps) {
  const links = buildHreflangLinks(pathname)

  return (
    <>
      {links.map(({ hrefLang, href }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}
    </>
  )
}
