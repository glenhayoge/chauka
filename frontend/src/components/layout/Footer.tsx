import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link to="/" className="text-lg text-muted-foreground">Chauka</Link>
        <div className="flex flex-wrap gap-2">
          <Link to="/#features" className="text-xs text-muted-foreground hover:text-foreground">Features</Link>
          <Link to="/#about" className="text-xs text-muted-foreground hover:text-foreground">About</Link>
          <Link to="/docs" className="text-xs text-muted-foreground hover:text-foreground">Docs</Link>
          <Link to="/help" className="text-xs text-muted-foreground hover:text-foreground">Help</Link>
          <Link to="/#contact" className="text-xs text-muted-foreground hover:text-foreground">Contact</Link>
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground">Privacy</Link>
          <a href="https://github.com/glenhayoge/chauka" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
