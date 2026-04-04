import EditableField from './EditableField'

export interface FieldDef {
  label: string
  value: string
  entity: string
  field: string
}

interface Props {
  title: string
  fields: FieldDef[]
  onSave: (entity: string, field: string, value: string) => Promise<void>
  canEdit: boolean
  isPlaceholder?: boolean
}

export default function SettingsSection({ title, fields, onSave, canEdit, isPlaceholder }: Props) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
        {isPlaceholder && (
          <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded font-medium">
            Needs update
          </span>
        )}
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <EditableField
            key={`${f.entity}-${f.field}`}
            label={f.label}
            value={f.value}
            onSave={(v) => onSave(f.entity, f.field, v)}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  )
}
