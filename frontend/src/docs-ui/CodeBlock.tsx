import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  children?: ReactNode
  className?: string
}

let shikiHighlighter: Awaited<ReturnType<typeof import('shiki')['createHighlighter']>> | null = null
let shikiLoading: Promise<void> | null = null

function loadShiki() {
  if (shikiHighlighter) return Promise.resolve()
  if (shikiLoading) return shikiLoading
  shikiLoading = import('shiki').then(async ({ createHighlighter }) => {
    shikiHighlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['typescript', 'tsx', 'python', 'bash', 'json', 'yaml', 'sql', 'html', 'css', 'markdown', 'toml'],
    })
  })
  return shikiLoading
}

export default function CodeBlock({ children, className }: Props) {
  const [html, setHtml] = useState('')
  const lang = className?.replace('language-', '') || 'text'
  const code = typeof children === 'string' ? children.trim() : String(children ?? '').trim()

  useEffect(() => {
    loadShiki().then(() => {
      if (!shikiHighlighter) return
      const result = shikiHighlighter.codeToHtml(code, {
        lang: shikiHighlighter.getLoadedLanguages().includes(lang) ? lang : 'text',
        themes: { light: 'github-light', dark: 'github-dark' },
      })
      setHtml(result)
    })
  }, [code, lang])

  if (!html) {
    return (
      <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <div
      className="rounded-md overflow-x-auto text-sm [&_pre]:p-4 [&_pre]:overflow-x-auto [&_.shiki]:bg-muted!"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
