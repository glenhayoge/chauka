import { useQueryClient } from '@tanstack/react-query'
import type { Organisation } from '../../api/types'
import { updateOrganisation } from '../../api/organisations'
import SettingsSection from './SettingsSection'
import { COUNTRIES, ORG_TYPES, SECTORS } from '../../utils/orgOptions'

interface Props {
  org: Organisation
  canEdit: boolean
}

export default function OrgGeneralPanel({ org, canEdit }: Props) {
  const queryClient = useQueryClient()

  async function handleSave(_entity: string, field: string, value: string) {
    await updateOrganisation(org.id, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['organisation', org.id] })
    queryClient.invalidateQueries({ queryKey: ['organisations'] })
  }

  async function handleSelectChange(field: string, value: string) {
    await updateOrganisation(org.id, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['organisation', org.id] })
    queryClient.invalidateQueries({ queryKey: ['organisations'] })
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Organisation Details"
        fields={[
          { label: 'Name', value: org.name, entity: 'org', field: 'name' },
          { label: 'URL Slug', value: org.slug, entity: 'org', field: 'slug' },
          { label: 'Description', value: org.description, entity: 'org', field: 'description' },
        ]}
        onSave={handleSave}
        canEdit={canEdit}
      />

      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Organisation Profile
        </h3>
        <div className="space-y-3">
          <SelectField
            label="Country"
            value={org.country}
            options={COUNTRIES}
            onChange={(v) => handleSelectChange('country', v)}
            disabled={!canEdit}
          />
          <SelectField
            label="Organisation Type"
            value={org.org_type}
            options={ORG_TYPES}
            onChange={(v) => handleSelectChange('org_type', v)}
            disabled={!canEdit}
          />
          <SelectField
            label="Sector"
            value={org.sector}
            options={SECTORS}
            onChange={(v) => handleSelectChange('sector', v)}
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  )
}

function SelectField({ label, value, options, onChange, disabled }: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
