import { useTranslation } from 'react-i18next'

const FAQ_COUNT = 10

export function SeoSchema() {
  const { t } = useTranslation()

  const faqItems = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    '@type': 'Question' as const,
    name: t(`landing.faq.q${i + 1}`),
    acceptedAnswer: {
      '@type': 'Answer' as const,
      text: t(`landing.faq.a${i + 1}`),
    },
  }))

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Autoceny',
      url: 'https://autoceny.eu',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Autoceny',
      url: 'https://autoceny.eu',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems,
    },
  ]

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
