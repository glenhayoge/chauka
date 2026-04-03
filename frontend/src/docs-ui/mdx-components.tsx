import type { ComponentPropsWithoutRef } from 'react'
import CodeBlock from './CodeBlock'

function heading(Tag: 'h1' | 'h2' | 'h3' | 'h4') {
  const styles: Record<string, string> = {
    h1: 'text-2xl font-bold mt-0 mb-4',
    h2: 'text-xl font-semibold mt-10 mb-3 pb-2 border-b border-border',
    h3: 'text-lg font-semibold mt-8 mb-2',
    h4: 'text-base font-semibold mt-6 mb-2',
  }
  return function H(props: ComponentPropsWithoutRef<'h1'>) {
    return <Tag className={styles[Tag]} {...props} />
  }
}

export const mdxComponents = {
  h1: heading('h1'),
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="text-sm leading-relaxed text-foreground/80 mb-4" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a className="text-primary underline underline-offset-2 hover:text-primary/80" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc pl-5 space-y-1 mb-4 text-sm text-foreground/80" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal pl-5 space-y-1 mb-4 text-sm text-foreground/80" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-relaxed" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 italic text-sm text-muted-foreground my-4" {...props} />
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-3 py-2 border-b-2 border-border bg-muted" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="px-3 py-2 border-b border-border" {...props} />
  ),
  hr: () => <hr className="border-border my-8" />,
  code: (props: ComponentPropsWithoutRef<'code'>) => {
    const { className, children, ...rest } = props
    // Fenced code blocks get className="language-*" from MDX
    if (className) {
      return <CodeBlock className={className}>{children}</CodeBlock>
    }
    // Inline code
    return (
      <code className="bg-muted text-sm px-1.5 py-0.5 rounded font-mono" {...rest}>
        {children}
      </code>
    )
  },
  pre: (props: ComponentPropsWithoutRef<'pre'>) => {
    // MDX wraps fenced code blocks in <pre><code>. We handle highlighting
    // in the code component, so just pass children through.
    return <>{props.children}</>
  },
}
