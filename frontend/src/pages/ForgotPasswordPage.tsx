import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await forgotPassword(email)
      setResetLink(data.reset_link)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              If an account with that email exists, a reset link has been generated.
            </p>
            {resetLink && (
              <div className="border border-gray-200 rounded-md p-3">
                <p className="text-xs text-gray-400 mb-1">Reset link:</p>
                <a href={resetLink} className="text-sm text-gray-700 hover:text-gray-900 break-all">
                  {resetLink}
                </a>
              </div>
            )}
            <Link to="/login" className="block text-sm text-gray-500 hover:text-gray-700">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-900 mb-1">Reset your password</p>
            <p className="text-sm text-gray-500 mb-4">Enter your email to get a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-2 text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-gray-700 hover:text-gray-900">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
