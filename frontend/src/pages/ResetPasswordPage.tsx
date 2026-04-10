import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetPassword, verifyResetToken } from '../api/auth'

const inputClass = "w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) { setValidating(false); return }
    verifyResetToken(token)
      .then(() => { setTokenValid(true); setValidating(false) })
      .catch(() => { setTokenValid(false); setValidating(false) })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('At least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await resetPassword(token!, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Validating...</p>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <p className="text-sm text-foreground mb-2">This reset link is invalid or expired.</p>
          <Link to="/forgot-password" className="text-sm text-foreground hover:text-foreground">
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <p className="text-sm text-foreground mb-2">Password reset. Redirecting to sign in...</p>
          <Link to="/login" className="text-sm text-foreground hover:text-foreground">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <p className="text-sm font-medium text-foreground mb-4">Set a new password</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="new-password" className="block text-sm text-muted-foreground mb-1">New password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              aria-describedby="new-password-hint"
              className={inputClass}
              required
              minLength={8}
            />
            <p id="new-password-hint" className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm text-muted-foreground mb-1">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!error}
              className={inputClass}
              required
              minLength={8}
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
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  )
}
