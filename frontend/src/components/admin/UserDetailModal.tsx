import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAdminUser, deactivateAdminUser, adminResetPassword } from '../../api/admin'
import type { AdminUser } from '../../api/types'

interface Props {
  user: AdminUser
  onClose: () => void
}

export default function UserDetailModal({ user, onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    is_staff: user.is_staff,
    is_superuser: user.is_superuser,
    is_active: user.is_active,
  })
  const [error, setError] = useState('')
  const [resetLink, setResetLink] = useState('')

  const updateMutation = useMutation({
    mutationFn: () => updateAdminUser(user.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to update user')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateAdminUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to deactivate user')
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => adminResetPassword(user.id),
    onSuccess: (data) => {
      setResetLink(data.reset_link)
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to generate reset link')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    updateMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-semibold">Edit User: {user.username}</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground text-lg">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted">First Name</span>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="mt-1 block w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Last Name</span>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="mt-1 block w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-muted">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_staff}
                onChange={(e) => setForm({ ...form, is_staff: e.target.checked })}
                className="rounded border-border"
              />
              Staff
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_superuser}
                onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })}
                className="rounded border-border"
              />
              Superuser
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-border"
              />
              Active
            </label>
          </div>

          {/* Password reset */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {resetMutation.isPending ? 'Generating...' : 'Generate Password Reset Link'}
            </button>
            {resetLink && (
              <div className="mt-2 p-2 bg-secondary/30 rounded text-xs break-all">
                <p className="text-muted mb-1">Reset link (share with user):</p>
                <code>{resetLink}</code>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Deactivate user "${user.username}"?`)) {
                  deactivateMutation.mutate()
                }
              }}
              disabled={deactivateMutation.isPending}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Deactivate
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-3 py-1.5 text-sm bg-foreground text-background rounded hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
