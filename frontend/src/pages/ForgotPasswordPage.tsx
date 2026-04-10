import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import PageTitle from '../components/PageTitle'

const inputClass = "w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await forgotPassword(email)
      // In production the API no longer returns reset_link — only shown in dev
      setDevResetLink(data.reset_link ?? null)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <PageTitle title="Reset password" description="Reset your Chauka password." />
      <div className="w-full max-w-sm">
        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              If an account with that email exists, a reset link has been sent. Check your inbox.
            </p>
            {devResetLink && (
              <div className="border border-dashed border-border rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Dev mode — reset link:
                </p>
                <a href={devResetLink} className="text-sm text-foreground hover:text-foreground break-all">
                  {devResetLink}
                </a>
              </div>
            )}
            <Link to="/login" className="block text-sm text-muted-foreground hover:text-foreground">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground mb-1">Reset your password</p>
            <p className="text-sm text-muted-foreground mb-4">Enter your email to get a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              {error && (
                <p role="alert" aria-live="polite" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background py-2 text-sm rounded-md hover:bg-foreground/80 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="text-sm text-muted-foreground mt-4">
              <Link to="/login" className="text-foreground hover:text-foreground">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
