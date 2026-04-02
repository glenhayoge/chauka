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
  { key: 'programs', label: 'Programs' },
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

  if (isLoading) return <p className="text-gray-500 p-6">Loading...</p>
  if (error || !org) return <p className="text-red-600 p-6">Organisation not found.</p>

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Lightweight header */}
      <header className="bg-blue-700 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app" className="text-lg font-semibold hover:text-blue-100">
            Chauka
          </Link>
          <span className="text-blue-300">/</span>
          <span className="text-sm text-blue-200 truncate">{org.name}</span>
          <span className="text-blue-300">/</span>
          <span className="text-sm text-blue-100">Settings</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200 hidden sm:inline">{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-blue-200 hover:text-white underline hover:no-underline"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Back link */}
        <Link to="/app" className="text-sm text-gray-500 hover:underline mb-4 inline-block">
          &larr; Back to organisations
        </Link>

        <h2 className="text-lg font-semibold mb-4">Organisation Settings</h2>

        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                'px-4 sm:px-6 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap',
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900',
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
          <ProgramsPanel orgId={id} />
        )}
      </main>
    </div>
  )
}
