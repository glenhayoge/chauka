import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { changePassword, getProfile, updateProfile, type UserProfile } from '../api/auth'
import { getOrganisations } from '../api/organisations'
import type { Organisation } from '../api/types'

const inputClass =
  'w-full border border-border rounded-[var(--radius)] px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring'

const labelClass = 'block text-sm text-muted-foreground mb-1'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [orgsError, setOrgsError] = useState('')

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

  useEffect(() => {
    getOrganisations()
      .then(setOrganisations)
      .catch(() => setOrgsError('Failed to load organisations'))
      .finally(() => setOrgsLoading(false))
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

  if (loading) return <p className="text-sm text-muted-foreground p-6">Loading...</p>
  if (!profile) return <p className="text-sm text-destructive p-6">Failed to load profile.</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link to="/app" className="text-sm text-muted-foreground hover:underline inline-block">
        &larr; Back to home
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Account details */}
        <div className="border border-border rounded-[var(--radius)] p-5 flex flex-col gap-4">
          <p className="text-sm font-medium text-foreground">Account details</p>
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full border border-border rounded-[var(--radius)] px-3 py-2 text-sm bg-muted text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>First name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-foreground text-background px-4 py-1.5 text-sm rounded-[var(--radius)] hover:bg-foreground/80 disabled:opacity-50 transition-colors"
              >
                {profileSaving ? 'Saving...' : 'Save'}
              </button>
              {profileSuccess && <span className="text-sm text-muted-foreground">{profileSuccess}</span>}
              {profileError && <span className="text-sm text-destructive">{profileError}</span>}
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="border border-border rounded-[var(--radius)] p-5 flex flex-col gap-4">
          <p className="text-sm font-medium text-foreground">Change password</p>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>Current password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} required autoComplete="current-password" />
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} required minLength={8} autoComplete="new-password" />
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} required minLength={8} autoComplete="new-password" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={passwordSaving}
                className="bg-foreground text-background px-4 py-1.5 text-sm rounded-[var(--radius)] hover:bg-foreground/80 disabled:opacity-50 transition-colors"
              >
                {passwordSaving ? 'Changing...' : 'Change password'}
              </button>
              {passwordSuccess && <span className="text-sm text-muted-foreground">{passwordSuccess}</span>}
              {passwordError && <span className="text-sm text-destructive">{passwordError}</span>}
            </div>
          </form>
        </div>

      </div>

      {/* Organisations */}
      <div className="border border-border rounded-[var(--radius)] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Organisations</p>
          <span className="text-xs text-muted-foreground">
            {organisations.length} {organisations.length === 1 ? 'membership' : 'memberships'}
          </span>
        </div>

        {orgsLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : orgsError ? (
          <p className="text-sm text-destructive">{orgsError}</p>
        ) : organisations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You are not yet a member of any organisation.{' '}
            <Link to="/app" className="text-foreground hover:underline">Create or join one</Link>.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {organisations.map((org) => {
              const isOwner = profile.id === org.owner_id
              const meta = [org.org_type, org.sector, org.country].filter(Boolean)
              return (
                <li
                  key={org.id}
                  className="border border-border rounded-[var(--radius)] px-4 py-3 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/organisations/${org.public_id}/dashboard`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {org.name}
                    </Link>
                    {isOwner && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                        Owner
                      </span>
                    )}
                  </div>
                  {org.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{org.description}</p>
                  )}
                  {meta.length > 0 && (
                    <p className="text-xs text-muted-foreground">{meta.join(' · ')}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Signed in as {profile.username}</p>
    </div>
  )
}
