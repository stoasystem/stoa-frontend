import { useEffect } from 'react'

interface SeoProps {
  title: string
  description?: string
}

export function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    document.title = title

    if (!description) return

    let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')

    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.append(metaDescription)
    }

    metaDescription.content = description
  }, [description, title])

  return null
}
