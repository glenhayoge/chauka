import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPrograms, createProgram, deleteProgram, updateProgram,
  getProjects, createProject, deleteProject, updateProject,
  getProjectLogframes, createLogframe, deleteLogframe, updateLogframe,
  getProgramLogframes, createProgramLogframe,
  getOrgProjects, createOrgProject, deleteOrgProject, updateOrgProject,
  getOrgProjectLogframes, createOrgProjectLogframe,
} from '../../api/organisations'
import type { Program, Project, Logframe } from '../../api/types'
import clsx from 'clsx'

interface Props {
  orgId: number
  canEdit: boolean
}

export default function ProgramsPanel({ orgId, canEdit }: Props) {
  const queryClient = useQueryClient()
  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs', orgId],
    queryFn: () => getPrograms(orgId),
  })

  const { data: standaloneProjects } = useQuery({
    queryKey: ['org-projects', orgId],
    queryFn: () => getOrgProjects(orgId),
  })

  const [newProgName, setNewProgName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAddProgram() {
    if (!newProgName.trim()) return
    setAdding(true)
    try {
      await createProgram(orgId, { name: newProgName.trim() })
      setNewProgName('')
      queryClient.invalidateQueries({ queryKey: ['programs', orgId] })
    } finally {
      setAdding(false)
    }
  }

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading programs...</p>

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage your programs, projects, and logframes. Logframes can be organised under a program,
        under a project within a program, or under a standalone project.
      </p>

      {programs?.map((prog) => (
        <ProgramCard key={prog.id} program={prog} orgId={orgId} canEdit={canEdit} />
      ))}

      {(!programs || programs.length === 0) && (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">No programs yet. Create one to get started.</p>
        </div>
      )}

      {/* Add program */}
      {canEdit && (
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newProgName}
            onChange={(e) => setNewProgName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProgram() } }}
            placeholder="New program name"
            className="flex-1 text-sm border border-input rounded-[var(--radius)] px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAddProgram}
            disabled={adding || !newProgName.trim()}
            className="text-sm px-4 py-1.5 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Program'}
          </button>
        </div>
      )}

      {/* Standalone projects (directly under org, no program) */}
      <div className="border-t border-border pt-4 mt-4">
        <StandaloneProjectsSection orgId={orgId} projects={standaloneProjects ?? []} canEdit={canEdit} />
      </div>
    </div>
  )
}

function ProgramCard({ program, orgId, canEdit }: { program: Program; orgId: number; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: projects } = useQuery({
    queryKey: ['projects', orgId, program.id],
    queryFn: () => getProjects(orgId, program.id),
    enabled: expanded,
  })

  const { data: programLogframes } = useQuery({
    queryKey: ['program-logframes', orgId, program.id],
    queryFn: () => getProgramLogframes(orgId, program.id),
    enabled: expanded,
  })

  async function handleDelete() {
    await deleteProgram(orgId, program.id)
    queryClient.invalidateQueries({ queryKey: ['programs', orgId] })
    setConfirmDelete(false)
  }

  async function handleUpdateName(value: string) {
    await updateProgram(orgId, program.id, { name: value })
    queryClient.invalidateQueries({ queryKey: ['programs', orgId] })
  }

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden shadow-xs">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground text-xs w-5 hover:text-foreground"
        >
          {expanded ? '\u25BC' : '\u25B6'}
        </button>
        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          Program
        </span>
        <div className="flex-1 min-w-0">
          <InlineEdit value={program.name} onSave={handleUpdateName} canEdit={canEdit} className="text-sm font-medium text-foreground" />
        </div>
        {program.start_date && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {program.start_date}{program.end_date ? ` – ${program.end_date}` : ''}
          </span>
        )}
        {canEdit && (
          <DeleteControl
            confirmDelete={confirmDelete}
            onRequestDelete={() => setConfirmDelete(true)}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 bg-muted/30 space-y-4">
          {/* Direct logframes (program without projects) */}
          <ProgramLogframesList orgId={orgId} programId={program.id} logframes={programLogframes ?? []} canEdit={canEdit} />

          {/* Projects under this program */}
          <ProjectsList orgId={orgId} programId={program.id} projects={projects ?? []} canEdit={canEdit} />
        </div>
      )}
    </div>
  )
}

function ProgramLogframesList({ orgId, programId, logframes, canEdit }: { orgId: number; programId: number; logframes: Logframe[]; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createProgramLogframe(orgId, programId, { name: newName.trim() })
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['program-logframes', orgId, programId] })
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(lfId: number) {
    await deleteLogframe(lfId)
    queryClient.invalidateQueries({ queryKey: ['program-logframes', orgId, programId] })
  }

  async function handleRename(lfId: number, name: string) {
    await updateLogframe(lfId, { name })
    queryClient.invalidateQueries({ queryKey: ['program-logframes', orgId, programId] })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Logframes (direct)</p>
      {logframes.map((lf) => (
        <LogframeRow key={lf.id} logframe={lf} onDelete={() => handleDelete(lf.id)} onRename={(name) => handleRename(lf.id, name)} canEdit={canEdit} />
      ))}
      {logframes.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">No logframes directly under this program.</p>
      )}
      {canEdit && (
        <div className="flex gap-1.5 mt-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="Add logframe"
            className="flex-1 text-xs border border-input rounded-[var(--radius)] px-2 py-1 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}

function ProjectsList({ orgId, programId, projects, canEdit }: { orgId: number; programId: number; projects: Project[]; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createProject(orgId, programId, { name: newName.trim() })
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['projects', orgId, programId] })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</p>
      {projects.map((proj) => (
        <ProjectCard key={proj.id} project={proj} orgId={orgId} programId={programId} canEdit={canEdit} />
      ))}
      {projects.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">No projects in this program.</p>
      )}
      {canEdit && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="New project name"
            className="flex-1 text-xs border border-input rounded-[var(--radius)] px-2.5 py-1 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50"
          >
            Add Project
          </button>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, orgId, programId, canEdit }: { project: Project; orgId: number; programId: number; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: logframes } = useQuery({
    queryKey: ['project-logframes', orgId, programId, project.id],
    queryFn: () => getProjectLogframes(orgId, programId, project.id),
    enabled: expanded,
  })

  async function handleDelete() {
    await deleteProject(orgId, programId, project.id)
    queryClient.invalidateQueries({ queryKey: ['projects', orgId, programId] })
    setConfirmDelete(false)
  }

  async function handleUpdateName(value: string) {
    await updateProject(orgId, programId, project.id, { name: value })
    queryClient.invalidateQueries({ queryKey: ['projects', orgId, programId] })
  }

  const statusStyles: Record<string, string> = {
    active: 'bg-[#16a34a]/10 text-[#16a34a]',
    completed: 'bg-muted text-muted-foreground',
    archived: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] ml-4 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground text-xs w-4 hover:text-foreground">
          {expanded ? '\u25BC' : '\u25B6'}
        </button>
        <span className="text-[10px] font-medium text-secondary-foreground bg-secondary/30 px-1.5 py-0.5 rounded">
          Project
        </span>
        <div className="flex-1 min-w-0">
          <InlineEdit value={project.name} onSave={handleUpdateName} canEdit={canEdit} className="text-sm text-foreground" />
        </div>
        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', statusStyles[project.status] ?? statusStyles.active)}>
          {project.status}
        </span>
        {canEdit && (
          <DeleteControl
            confirmDelete={confirmDelete}
            onRequestDelete={() => setConfirmDelete(true)}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-2 bg-muted/30">
          <LogframesList orgId={orgId} programId={programId} projectId={project.id} logframes={logframes ?? []} canEdit={canEdit} />
        </div>
      )}
    </div>
  )
}

function LogframesList({ orgId, programId, projectId, logframes, canEdit }: { orgId: number; programId: number; projectId: number; logframes: Logframe[]; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createLogframe(orgId, programId, projectId, { name: newName.trim() })
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['project-logframes', orgId, programId, projectId] })
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(lfId: number) {
    await deleteLogframe(lfId)
    queryClient.invalidateQueries({ queryKey: ['project-logframes', orgId, programId, projectId] })
  }

  async function handleRename(lfId: number, name: string) {
    await updateLogframe(lfId, { name })
    queryClient.invalidateQueries({ queryKey: ['project-logframes', orgId, programId, projectId] })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Logframes</p>
      {logframes.map((lf) => (
        <LogframeRow key={lf.id} logframe={lf} onDelete={() => handleDelete(lf.id)} onRename={(name) => handleRename(lf.id, name)} canEdit={canEdit} />
      ))}
      {logframes.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">No logframes yet.</p>
      )}
      {canEdit && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="New logframe name"
            className="flex-1 text-xs border border-input rounded-[var(--radius)] px-2 py-1 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}

function LogframeRow({ logframe, onDelete, onRename, canEdit }: { logframe: Logframe; onDelete: () => void; onRename: (name: string) => Promise<void>; canEdit: boolean }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex items-center gap-2 bg-background border border-border rounded-[var(--radius)] px-2.5 py-1.5 ml-4">
      <span className="text-[10px] font-medium text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
        Logframe
      </span>
      <div className="flex-1 min-w-0">
        <InlineEdit value={logframe.name} onSave={onRename} canEdit={canEdit} className="text-xs text-foreground" />
      </div>
      <Link
        to={`/app/logframes/${logframe.id}`}
        className="text-[10px] text-primary hover:underline flex-shrink-0"
      >
        Open
      </Link>
      {canEdit && (
        <DeleteControl
          confirmDelete={confirmDelete}
          onRequestDelete={() => setConfirmDelete(true)}
          onConfirm={() => { onDelete(); setConfirmDelete(false) }}
          onCancel={() => setConfirmDelete(false)}
          size="sm"
        />
      )}
    </div>
  )
}

// --- Standalone org projects (no program) ---

function StandaloneProjectsSection({ orgId, projects, canEdit }: { orgId: number; projects: Project[]; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createOrgProject(orgId, { name: newName.trim() })
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['org-projects', orgId] })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Standalone Projects</p>
      <p className="text-xs text-muted-foreground">
        Projects not under any program. Logframes created here follow the Org &rarr; Project &rarr; Logframe path.
      </p>

      {projects.map((proj) => (
        <StandaloneProjectCard key={proj.id} project={proj} orgId={orgId} canEdit={canEdit} />
      ))}

      {projects.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">No standalone projects.</p>
      )}

      {canEdit && (
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="New project name"
            className="flex-1 text-sm border border-input rounded-[var(--radius)] px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="text-sm px-4 py-1.5 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Project'}
          </button>
        </div>
      )}
    </div>
  )
}

function StandaloneProjectCard({ project, orgId, canEdit }: { project: Project; orgId: number; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: logframes } = useQuery({
    queryKey: ['org-project-logframes', orgId, project.id],
    queryFn: () => getOrgProjectLogframes(orgId, project.id),
    enabled: expanded,
  })

  async function handleDelete() {
    await deleteOrgProject(orgId, project.id)
    queryClient.invalidateQueries({ queryKey: ['org-projects', orgId] })
    setConfirmDelete(false)
  }

  async function handleUpdateName(value: string) {
    await updateOrgProject(orgId, project.id, { name: value })
    queryClient.invalidateQueries({ queryKey: ['org-projects', orgId] })
  }

  const statusStyles: Record<string, string> = {
    active: 'bg-[#16a34a]/10 text-[#16a34a]',
    completed: 'bg-muted text-muted-foreground',
    archived: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden shadow-xs">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground text-xs w-5 hover:text-foreground"
        >
          {expanded ? '\u25BC' : '\u25B6'}
        </button>
        <span className="text-[10px] font-medium text-secondary-foreground bg-secondary/30 px-1.5 py-0.5 rounded">
          Project
        </span>
        <div className="flex-1 min-w-0">
          <InlineEdit value={project.name} onSave={handleUpdateName} canEdit={canEdit} className="text-sm font-medium text-foreground" />
        </div>
        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', statusStyles[project.status] ?? statusStyles.active)}>
          {project.status}
        </span>
        {canEdit && (
          <DeleteControl
            confirmDelete={confirmDelete}
            onRequestDelete={() => setConfirmDelete(true)}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <StandaloneLogframesList orgId={orgId} projectId={project.id} logframes={logframes ?? []} canEdit={canEdit} />
        </div>
      )}
    </div>
  )
}

function StandaloneLogframesList({ orgId, projectId, logframes, canEdit }: { orgId: number; projectId: number; logframes: Logframe[]; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createOrgProjectLogframe(orgId, projectId, { name: newName.trim() })
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['org-project-logframes', orgId, projectId] })
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(lfId: number) {
    await deleteLogframe(lfId)
    queryClient.invalidateQueries({ queryKey: ['org-project-logframes', orgId, projectId] })
  }

  async function handleRename(lfId: number, name: string) {
    await updateLogframe(lfId, { name })
    queryClient.invalidateQueries({ queryKey: ['org-project-logframes', orgId, projectId] })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Logframes</p>
      {logframes.map((lf) => (
        <LogframeRow key={lf.id} logframe={lf} onDelete={() => handleDelete(lf.id)} onRename={(name) => handleRename(lf.id, name)} canEdit={canEdit} />
      ))}
      {logframes.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">No logframes yet.</p>
      )}
      {canEdit && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="New logframe name"
            className="flex-1 text-xs border border-input rounded-[var(--radius)] px-2 py-1 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}

// --- Shared UI helpers ---

function InlineEdit({ value, onSave, canEdit, className }: { value: string; onSave: (v: string) => Promise<void>; canEdit: boolean; className?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setEditing(false)
    if (draft.trim() && draft !== value) {
      setSaving(true)
      try { await onSave(draft.trim()) } finally { setSaving(false) }
    } else {
      setDraft(value)
    }
  }

  if (editing && canEdit) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className="w-full border border-ring rounded-[var(--radius)] px-2 py-0.5 text-sm bg-background text-foreground focus:outline-none"
      />
    )
  }

  return (
    <span
      onClick={() => canEdit && setEditing(true)}
      className={clsx(
        className,
        saving && 'opacity-50',
        canEdit && 'cursor-pointer hover:text-primary',
        !value && 'text-muted-foreground italic',
      )}
    >
      {value || 'Click to edit'}
    </span>
  )
}

function DeleteControl({ confirmDelete, onRequestDelete, onConfirm, onCancel, size = 'md' }: {
  confirmDelete: boolean
  onRequestDelete: () => void
  onConfirm: () => void
  onCancel: () => void
  size?: 'sm' | 'md'
}) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  if (confirmDelete) {
    return (
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onConfirm} className={clsx(textSize, 'px-2 py-0.5 bg-destructive text-destructive-foreground rounded-[var(--radius)]')}>
          Confirm
        </button>
        <button onClick={onCancel} className={clsx(textSize, 'px-2 py-0.5 border border-border text-foreground rounded-[var(--radius)] hover:bg-muted')}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={onRequestDelete} className={clsx(textSize, 'text-destructive/60 hover:text-destructive flex-shrink-0')}>
      Delete
    </button>
  )
}
