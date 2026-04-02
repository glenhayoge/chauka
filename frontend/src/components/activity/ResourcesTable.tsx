import { useState } from 'react'
import type { Resource } from '../../api/types'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import DeleteButton from '../ui/DeleteButton'

interface Props {
  resources: Resource[]
  activityId: number
  logframeId: number
  canEdit: boolean
}

const RESOURCE_TYPES = [
  { value: 'human', label: 'Human Resources' },
  { value: 'equipment', label: 'Equipment / Assets' },
  { value: 'partner', label: 'Partners / Institutions' },
]

export default function ResourcesTable({ resources, activityId, logframeId, canEdit }: Props) {
  const queryClient = useQueryClient()

  const humanResources = resources.filter((r) => r.resource_type === 'human')
  const equipment = resources.filter((r) => r.resource_type === 'equipment')
  const partners = resources.filter((r) => r.resource_type === 'partner')

  async function deleteResource(id: number) {
    await apiClient.delete(`/logframes/${logframeId}/resources/${id}`)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  return (
    <div className="space-y-3">
      {/* Human Resources */}
      {humanResources.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Human Resources</p>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Role</th>
                  <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Person</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">Qty</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">Days</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">%</th>
                  {canEdit && <th className="border border-gray-200 px-1 py-1 w-6" />}
                </tr>
              </thead>
              <tbody>
                {humanResources.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-2 py-1">{r.role}</td>
                    <td className="border border-gray-200 px-2 py-1 text-gray-500">{r.person || '—'}</td>
                    <td className="border border-gray-200 px-2 py-1 text-center">{r.quantity}</td>
                    <td className="border border-gray-200 px-2 py-1 text-center">{r.days_required}</td>
                    <td className="border border-gray-200 px-2 py-1 text-center">{r.allocation_pct != null ? `${r.allocation_pct}%` : '—'}</td>
                    {canEdit && (
                      <td className="border border-gray-200 px-1 py-1 text-center">
                        <DeleteButton onClick={() => deleteResource(r.id)} label="Remove" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equipment */}
      {equipment.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Equipment / Assets</p>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Resource</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">Qty</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">Days</th>
                  {canEdit && <th className="border border-gray-200 px-1 py-1 w-6" />}
                </tr>
              </thead>
              <tbody>
                {equipment.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-2 py-1">{r.resource_name}</td>
                    <td className="border border-gray-200 px-2 py-1 text-center">{r.quantity}</td>
                    <td className="border border-gray-200 px-2 py-1 text-center">{r.days_required}</td>
                    {canEdit && (
                      <td className="border border-gray-200 px-1 py-1 text-center">
                        <DeleteButton onClick={() => deleteResource(r.id)} label="Remove" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partners */}
      {partners.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Partners / Institutions</p>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Organisation</th>
                  <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Role</th>
                  {canEdit && <th className="border border-gray-200 px-1 py-1 w-6" />}
                </tr>
              </thead>
              <tbody>
                {partners.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-2 py-1">{r.organisation_name}</td>
                    <td className="border border-gray-200 px-2 py-1 text-gray-500">{r.role_in_activity}</td>
                    {canEdit && (
                      <td className="border border-gray-200 px-1 py-1 text-center">
                        <DeleteButton onClick={() => deleteResource(r.id)} label="Remove" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resources.length === 0 && (
        <p className="text-xs text-gray-400 italic">No resources assigned yet.</p>
      )}

      {/* Add resource */}
      {canEdit && (
        <AddResourceForm activityId={activityId} logframeId={logframeId} />
      )}
    </div>
  )
}

function AddResourceForm({ activityId, logframeId }: { activityId: number; logframeId: number }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('')
  const [saving, setSaving] = useState(false)

  // Human fields
  const [role, setRole] = useState('')
  const [person, setPerson] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [days, setDays] = useState('0')
  const [allocation, setAllocation] = useState('')

  // Equipment fields
  const [resourceName, setResourceName] = useState('')

  // Partner fields
  const [orgName, setOrgName] = useState('')
  const [roleInActivity, setRoleInActivity] = useState('')

  function reset() {
    setType('')
    setRole('')
    setPerson('')
    setQuantity('1')
    setDays('0')
    setAllocation('')
    setResourceName('')
    setOrgName('')
    setRoleInActivity('')
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!type) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { resource_type: type }
      if (type === 'human') {
        Object.assign(body, {
          role,
          person,
          quantity: parseInt(quantity) || 1,
          days_required: parseInt(days) || 0,
          allocation_pct: allocation ? parseInt(allocation) : null,
        })
      } else if (type === 'equipment') {
        Object.assign(body, {
          resource_name: resourceName,
          quantity: parseInt(quantity) || 1,
          days_required: parseInt(days) || 0,
        })
      } else if (type === 'partner') {
        Object.assign(body, {
          organisation_name: orgName,
          role_in_activity: roleInActivity,
        })
      }
      await apiClient.post(`/logframes/${logframeId}/resources/?activity_id=${activityId}`, body)
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
      reset()
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        + Add Resource
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-3 bg-blue-50 space-y-2 mt-1">
      <div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
          className="border rounded px-2 py-1 text-xs w-full"
        >
          <option value="">Select resource type</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {type === 'human' && (
        <div className="flex flex-wrap gap-2">
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Extension Officer)" required className="border rounded px-2 py-1 text-xs flex-1 min-w-[140px]" />
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Person (optional)" className="border rounded px-2 py-1 text-xs flex-1 min-w-[120px]" />
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" className="border rounded px-2 py-1 text-xs w-16" />
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" className="border rounded px-2 py-1 text-xs w-16" />
          <input type="number" value={allocation} onChange={(e) => setAllocation(e.target.value)} placeholder="% (opt)" className="border rounded px-2 py-1 text-xs w-20" />
        </div>
      )}

      {type === 'equipment' && (
        <div className="flex flex-wrap gap-2">
          <input value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="Resource name (e.g. Vehicle, Projector)" required className="border rounded px-2 py-1 text-xs flex-1 min-w-[160px]" />
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" className="border rounded px-2 py-1 text-xs w-16" />
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" className="border rounded px-2 py-1 text-xs w-16" />
        </div>
      )}

      {type === 'partner' && (
        <div className="flex flex-wrap gap-2">
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organisation name" required className="border rounded px-2 py-1 text-xs flex-1 min-w-[160px]" />
          <input value={roleInActivity} onChange={(e) => setRoleInActivity(e.target.value)} placeholder="Role in activity" required className="border rounded px-2 py-1 text-xs flex-1 min-w-[140px]" />
        </div>
      )}

      {type && (
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Adding...' : 'Add'}
          </button>
          <button type="button" onClick={reset} className="px-3 py-1 text-gray-500 text-xs rounded border hover:bg-gray-50">
            Cancel
          </button>
        </div>
      )}
    </form>
  )
}
