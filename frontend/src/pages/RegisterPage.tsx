import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuthStore } from '../store/auth'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const storeLogin = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!agreedToTerms) {
      setError('You must agree to the terms to continue')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await register({
        username,
        password,
        email: email || undefined,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      })
      storeLogin(data.access_token, data.user_id, data.username, data.is_staff)
      navigate('/app')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-xl">
          <p className="text-sm font-medium text-gray-900 mb-6">Create an account</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                required
              />
            </div>
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
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-400 mt-1">At least 6 characters</p>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
              />
              <label htmlFor="terms" className="text-sm text-gray-500">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="text-gray-700 hover:text-gray-900">terms</a>
                {' and '}
                <a href="/privacy" target="_blank" className="text-gray-700 hover:text-gray-900">privacy policy</a>
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full bg-gray-900 text-white py-2 text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account\u2026' : 'Create account'}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4">
            Have an account?{' '}
            <Link to="/login" className="text-gray-700 hover:text-gray-900">Sign in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
