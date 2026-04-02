import { useLogframeStore } from '../../store/logframe'
import { useQueryClient } from '@tanstack/react-query'
import {
  updateOrganisation,
  updateProgram,
  updateProject,
  updateLogframe,
} from '../../api/organisations'
import SettingsSection from './SettingsSection'
import { COUNTRIES, ORG_TYPES, SECTORS } from '../../utils/orgOptions'

interface Props {
  logframeId: number
  canEdit: boolean
}

export default function OrgSettingsPanel({ logframeId, canEdit }: Props) {
  const data = useLogframeStore((s) => s.data)
  const queryClient = useQueryClient()

  if (!data?.orgContext) {
    return (
      <p className="text-sm text-gray-400 italic">
        This logframe is not linked to an organisation yet.
      </p>
    )
  }

  const { organisation, program, project } = data.orgContext
  const logframe = data.logframe

  async function saveField(entity: string, field: string, value: string) {
    if (entity === 'org') {
      await updateOrganisation(organisation.id, { [field]: value })
    } else if (entity === 'program' && program) {
      await updateProgram(organisation.id, program.id, { [field]: value })
    } else if (entity === 'project' && project && program) {
      await updateProject(organisation.id, program.id, project.id, { [field]: value })
    } else if (entity === 'logframe') {
      await updateLogframe(logframeId, { name: value })
    }
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
    queryClient.invalidateQueries({ queryKey: ['organisations'] })
  }

  async function handleOrgSelectChange(field: string, value: string) {
    await updateOrganisation(organisation.id, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
    queryClient.invalidateQueries({ queryKey: ['organisations'] })
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Organisation"
        fields={[
          { label: 'Name', value: organisation.name, entity: 'org', field: 'name' },
          { label: 'Slug', value: organisation.slug, entity: 'org', field: 'slug' },
          { label: 'Description', value: organisation.description, entity: 'org', field: 'description' },
        ]}
        onSave={saveField}
        canEdit={canEdit}
      />

      {/* Organisation profile selects */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Organisation Profile
        </h3>
        <div className="space-y-3">
          <SelectField
            label="Country"
            value={organisation.country}
            options={COUNTRIES}
            onChange={(v) => handleOrgSelectChange('country', v)}
            disabled={!canEdit}
          />
          <SelectField
            label="Organisation Type"
            value={organisation.org_type}
            options={ORG_TYPES}
            onChange={(v) => handleOrgSelectChange('org_type', v)}
            disabled={!canEdit}
          />
          <SelectField
            label="Sector"
            value={organisation.sector}
            options={SECTORS}
            onChange={(v) => handleOrgSelectChange('sector', v)}
            disabled={!canEdit}
          />
        </div>
      </div>

      {program && (
        <SettingsSection
          title="Program"
          fields={[
            { label: 'Name', value: program.name, entity: 'program', field: 'name' },
            { label: 'Description', value: program.description, entity: 'program', field: 'description' },
          ]}
          onSave={saveField}
          canEdit={canEdit}
          isPlaceholder={program.name === 'Untitled Program'}
        />
      )}
      {project && (
        <SettingsSection
          title="Project"
          fields={[
            { label: 'Name', value: project.name, entity: 'project', field: 'name' },
            { label: 'Description', value: project.description, entity: 'project', field: 'description' },
          ]}
          onSave={saveField}
          canEdit={canEdit}
          isPlaceholder={project.name === 'Untitled Project'}
        />
      )}
      <SettingsSection
        title="Logframe"
        fields={[
          { label: 'Name', value: logframe.name, entity: 'logframe', field: 'name' },
        ]}
        onSave={saveField}
        canEdit={canEdit}
        isPlaceholder={logframe.name === 'Untitled Logframe'}
      />
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
