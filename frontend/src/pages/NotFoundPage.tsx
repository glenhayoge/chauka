import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl font-bold text-foreground/20">404</p>
        <h1 className="text-lg font-semibold text-foreground mt-4">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/app"
          className="inline-block mt-6 px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
