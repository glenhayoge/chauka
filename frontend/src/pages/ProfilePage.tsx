import { useEffect, useState } from 'react'
import { changePassword, getProfile, updateProfile, type UserProfile } from '../api/auth'

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data)
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setEmail(data.email)
      })
      .catch(() => setProfileError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileSaving(true)
    try {
      const updated = await updateProfile({ first_name: firstName, last_name: lastName, email })
      setProfile(updated)
      setProfileSuccess('Saved')
    } catch {
      setProfileError('Failed to update')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword.length < 8) { setPasswordError('At least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess('Password changed')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setPasswordError(msg || 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-400 p-6">Loading...</p>
  if (!profile) return <p className="text-sm text-red-600 p-6">Failed to load profile.</p>

  return (
    <div className="max-w-lg">
      {/* Account details */}
      <form onSubmit={handleProfileSubmit} className="space-y-3 mb-8">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Username</label>
          <input
            type="text"
            value={profile.username}
            disabled
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">First name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Last name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={profileSaving}
            className="bg-gray-900 text-white px-4 py-1.5 text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {profileSaving ? 'Saving...' : 'Save'}
          </button>
          {profileSuccess && <span className="text-sm text-gray-500">{profileSuccess}</span>}
          {profileError && <span className="text-sm text-red-600">{profileError}</span>}
        </div>
      </form>

      {/* Password */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-600 mb-3">Change password</p>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} required minLength={8} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} required minLength={8} />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={passwordSaving}
              className="bg-gray-900 text-white px-4 py-1.5 text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {passwordSaving ? 'Changing...' : 'Change password'}
            </button>
            {passwordSuccess && <span className="text-sm text-gray-500">{passwordSuccess}</span>}
            {passwordError && <span className="text-sm text-red-600">{passwordError}</span>}
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="border-t border-gray-200 mt-6 pt-4">
        <p className="text-xs text-gray-400">Signed in as {profile.username}</p>
      </div>
    </div>
  )
}
