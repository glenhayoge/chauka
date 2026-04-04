import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const storeLogin = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      storeLogin(data.access_token, data.user_id, data.username, data.is_staff)
      navigate('/app')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 ">
        <div className="w-full max-w-sm">
          <p className="text-lg font-medium text-foreground mb-6">Sign in to Chauka</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-muted-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-accent py-2 text-sm rounded-md hover:bg-foreground/80 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in\u2026' : 'Sign in'}
            </button>
          </form>
          <p className="text-sm text-muted-foreground mt-4">
            No account?{' '}
            <Link to="/register" className="text-foreground hover:text-foreground">Create one</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
