import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { getInvitationByToken, acceptInvitation } from '../api/organisations'

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const isLoggedIn = !!useAuthStore((s) => s.token)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)

  const { data: invite, isLoading, error: fetchError } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => getInvitationByToken(token!),
    enabled: !!token,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading invitation...</p>
      </div>
    )
  }

  if (fetchError || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Invalid Invitation</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This invitation link is invalid or has expired.
          </p>
          <Link to="/login" className="text-primary hover:underline text-sm">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  if (invite.accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Already Accepted</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This invitation has already been accepted.
          </p>
          <Link to="/app" className="text-foreground hover:underline text-sm">
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  async function handleAccept() {
    if (!token) return
    setAccepting(true)
    setError('')
    try {
      await acceptInvitation(token)
      setAccepted(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-ok mb-2">Welcome!</h1>
          <p className="text-sm text-muted-foreground mb-4">
            You've joined <strong>{invite.organisation_name}</strong> as a {invite.role}.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 bg-primary text-background text-sm rounded hover:bg-primary/80"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">Chauka</h1>
        <p className="text-sm text-muted-foreground mb-4">
          You've been invited to join
        </p>
        <div className="bg-accent border border-border rounded-lg p-4 mb-4 text-center">
          <div className="text-lg font-semibold text-foreground">{invite.organisation_name}</div>
          <div className="text-sm text-muted-foreground mt-1">
            as <span className="font-medium capitalize">{invite.role}</span>
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="flex gap-2">
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="flex-1 text-center px-4 py-2 bg-primary text-background text-sm rounded hover:bg-primary/80"
              >
                Sign in
              </Link>
              <Link
                to={`/register?redirect=/invite/${token}`}
                className="flex-1 text-center px-4 py-2 border border-border text-foreground text-sm rounded hover:bg-muted"
              >
                Create account
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {error && <p className="text-destructive text-sm mb-3">{error}</p>}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full px-4 py-2 bg-primary text-background text-sm rounded hover:bg-primary/80 disabled:opacity-50"
            >
              {accepting ? 'Joining...' : 'Accept Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
