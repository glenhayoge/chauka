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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading invitation...</p>
      </div>
    )
  }

  if (fetchError || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm text-gray-500 mb-4">
            This invitation link is invalid or has expired.
          </p>
          <Link to="/login" className="text-blue-600 hover:underline text-sm">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  if (invite.accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Already Accepted</h1>
          <p className="text-sm text-gray-500 mb-4">
            This invitation has already been accepted.
          </p>
          <Link to="/app" className="text-gray-700 hover:underline text-sm">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-green-700 mb-2">Welcome!</h1>
          <p className="text-sm text-gray-500 mb-4">
            You've joined <strong>{invite.organisation_name}</strong> as a {invite.role}.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Chauka</h1>
        <p className="text-sm text-gray-500 mb-4">
          You've been invited to join
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center">
          <div className="text-lg font-semibold text-gray-900">{invite.organisation_name}</div>
          <div className="text-sm text-gray-500 mt-1">
            as <span className="font-medium capitalize">{invite.role}</span>
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="flex gap-2">
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Sign in
              </Link>
              <Link
                to={`/register?redirect=/invite/${token}`}
                className="flex-1 text-center px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Create account
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {accepting ? 'Joining...' : 'Accept Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
