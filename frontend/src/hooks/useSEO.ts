import { useEffect } from 'react'

interface SEOOptions {
  title: string
  description: string
  canonical: string
  /** Override og:title — defaults to `title` */
  ogTitle?: string
  /** Override og:description — defaults to `description` */
  ogDescription?: string
}

/**
 * Updates page-level SEO metadata imperatively:
 * <title>, meta description, canonical link, and Open Graph / Twitter Card tags.
 *
 * Works without react-helmet — mirrors the existing document.title pattern.
 */
export function useSEO({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
}: SEOOptions) {
  useEffect(() => {
    const resolvedOgTitle = ogTitle ?? title
    const resolvedOgDescription = ogDescription ?? description

    // 1. <title>
    document.title = title

    // 2. <meta name="description">
    setMeta('name', 'description', description)

    // 3. <link rel="canonical">
    setCanonical(canonical)

    // 4. Open Graph
    setMeta('property', 'og:title', resolvedOgTitle)
    setMeta('property', 'og:description', resolvedOgDescription)
    setMeta('property', 'og:url', canonical)

    // 5. Twitter Card
    setMeta('name', 'twitter:title', resolvedOgTitle)
    setMeta('name', 'twitter:description', resolvedOgDescription)
  }, [title, description, canonical, ogTitle, ogDescription])
}

// ─── helpers ────────────────────────────────────────────────────────────────

function setMeta(attrKey: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[${attrKey}="${attrValue}"]`,
  )
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrKey, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}
