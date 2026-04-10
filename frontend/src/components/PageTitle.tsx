import { Helmet } from 'react-helmet-async'

interface Props {
  title: string
  description?: string
}

/**
 * Sets the document <title> and optional description meta for the current page.
 * Appends " — Chauka" automatically unless the title is already just "Chauka".
 */
export default function PageTitle({ title, description }: Props) {
  const fullTitle = title === 'Chauka' ? title : `${title} — Chauka`
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      <meta name="twitter:title" content={fullTitle} />
    </Helmet>
  )
}
