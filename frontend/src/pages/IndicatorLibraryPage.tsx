import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import UserMenu from '../components/layout/UserMenu'
import { getOrganisation, getMembers } from '../api/organisations'
import { createLibraryIndicator } from '../api/indicatorLibrary'
import { useResolveOrgId } from '../hooks/useResolveIds'
import IndicatorLibrarySearch from '../components/library/IndicatorLibrarySearch'
import LibraryIndicatorForm from '../components/library/LibraryIndicatorForm'

export default function IndicatorLibraryPage() {
  const { orgId: publicId } = useParams<{ orgId: string }>()
  const { id: resolvedOrgId, isLoading: resolving, notFound } = useResolveOrgId(publicId)
  const queryClient = useQueryClient()
  const { userId } = useAuthStore()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: org, isLoading, error } = useQuery({
    queryKey: ['organisation', resolvedOrgId],
    queryFn: () => getOrganisation(resolvedOrgId!),
    enabled: resolvedOrgId !== null,
  })

  const { data: members } = useQuery({
    queryKey: ['org-members', resolvedOrgId],
    queryFn: () => getMembers(resolvedOrgId!),
    enabled: !!org,
  })

  const memberList = Array.isArray(members) ? members : []
  const currentMembership = memberList.find((m) => m.user_id === userId)
  const isAdmin = currentMembership?.role === 'admin' || org?.owner_id === userId

  if (resolving || isLoading) return <p className="text-muted-foreground p-6">Loading...</p>
  if (notFound || error || !org) return <p className="text-destructive p-6">Organisation not found.</p>

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl">
        <header className="bg-background/95 text-foreground px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/app" className="text-lg font-semibold hover:opacity-80">Chauka</Link>
            <span className="opacity-30">/</span>
            <Link to={`/organisations/${publicId}/dashboard`} className="text-sm opacity-50 hover:opacity-80 truncate">{org.name}</Link>
            <span className="opacity-30">/</span>
            <span className="text-sm opacity-80">Indicator Library</span>
          </div>
          <UserMenu />
        </header>
      </div>

      <main className="flex-1 p-3 sm:p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-4">
          <Link to={`/organisations/${publicId}/dashboard`} className="text-sm text-muted-foreground hover:underline">
            &larr; Back to dashboard
          </Link>
          <Link to={`/organisations/${publicId}/settings`} className="text-sm text-muted-foreground hover:text-foreground">
            Settings
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium text-foreground">Indicator Library</p>
          {isAdmin && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              + Add custom indicator
            </button>
          )}
        </div>

        {showForm && (
          <div className="border border-border rounded-[var(--radius)] p-5 mb-6">
            <p className="text-sm font-medium text-foreground mb-4">New custom indicator</p>
            <LibraryIndicatorForm
              organisationId={resolvedOrgId!}
              saving={saving}
              onCancel={() => setShowForm(false)}
              onSubmit={async (data) => {
                setSaving(true)
                try {
                  await createLibraryIndicator(data as Parameters<typeof createLibraryIndicator>[0])
                  queryClient.invalidateQueries({ queryKey: ['library-indicators'] })
                  setShowForm(false)
                } finally {
                  setSaving(false)
                }
              }}
            />
          </div>
        )}

        <IndicatorLibrarySearch organisationId={resolvedOrgId} />
      </main>
    </div>
  )
}
