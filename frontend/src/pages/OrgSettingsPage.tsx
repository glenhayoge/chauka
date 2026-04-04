import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { getOrganisation, getMembers } from '../api/organisations'
import clsx from 'clsx'
import OrgGeneralPanel from '../components/settings/OrgGeneralPanel'
import MembersPanel from '../components/settings/MembersPanel'
import ProgramsPanel from '../components/settings/ProgramsPanel'

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'members', label: 'Members' },
  { key: 'programs', label: 'Programs & Projects' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function OrgSettingsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const id = Number(orgId)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { username, userId, logout } = useAuthStore()

  const tabParam = searchParams.get('tab') as TabKey | null
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam) ? tabParam! : 'general'

  const { data: org, isLoading, error } = useQuery({
    queryKey: ['organisation', id],
    queryFn: () => getOrganisation(id),
  })

  const { data: members } = useQuery({
    queryKey: ['org-members', id],
    queryFn: () => getMembers(id),
    enabled: !!org,
  })

  // Determine if the current user is an admin
  const memberList = Array.isArray(members) ? members : []
  const currentMembership = memberList.find((m) => m.user_id === userId)
  const isAdmin = currentMembership?.role === 'admin' || org?.owner_id === userId
  const userRole = isAdmin ? 'admin' : (currentMembership?.role ?? null)

  function setTab(key: TabKey) {
    navigate(`/organisations/${id}/settings?tab=${key}`, { replace: true })
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (isLoading) return <p className="text-muted-foreground p-6">Loading...</p>
  if (error || !org) return <p className="text-destructive p-6">Organisation not found.</p>

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-foreground text-primary-foreground px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app" className="text-lg font-semibold hover:opacity-80">
            Chauka
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-sm opacity-50 truncate">{org.name}</span>
          <span className="opacity-30">/</span>
          <span className="text-sm opacity-80">Settings</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-70 hidden sm:inline">{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm opacity-70 hover:opacity-100 underline hover:no-underline"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-6 max-w-4xl mx-auto w-full">
        <Link to="/app" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
          &larr; Back to organisations
        </Link>

        <h2 className="text-lg font-semibold text-foreground mb-4">Organisation Settings</h2>

        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-border mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                'px-4 sm:px-6 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap',
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'general' && (
          <OrgGeneralPanel org={org} canEdit={isAdmin} />
        )}
        {activeTab === 'members' && (
          <MembersPanel canEdit={isAdmin} userRole={userRole} orgId={id} />
        )}
        {activeTab === 'programs' && (
          <ProgramsPanel orgId={id} canEdit={isAdmin} />
        )}
      </main>
    </div>
  )
}
