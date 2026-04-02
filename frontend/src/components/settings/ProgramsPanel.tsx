import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPrograms, createProgram, deleteProgram, updateProgram,
  getProjects, createProject, deleteProject, updateProject,
  getProjectLogframes, createLogframe, deleteLogframe,
  getProgramLogframes, createProgramLogframe,
} from '../../api/organisations'
import type { Program, Project, Logframe } from '../../api/types'
import EditableField from './EditableField'

interface Props {
  orgId: number
}

export default function ProgramsPanel({ orgId }: Props) {
  const queryClient = useQueryClient()
  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs', orgId],
    queryFn: () => getPrograms(orgId),
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

  if (isLoading) return <p className="text-gray-500 text-sm">Loading programs...</p>

  return (
    <div className="space-y-3">
      {programs?.map((prog) => (
        <ProgramCard key={prog.id} program={prog} orgId={orgId} />
      ))}

      {(!programs || programs.length === 0) && (
        <p className="text-sm text-gray-400 italic">No programs yet.</p>
      )}

      {/* Add program */}
      <div className="flex gap-2 max-w-md mt-2">
        <input
          type="text"
          value={newProgName}
          onChange={(e) => setNewProgName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProgram() } }}
          placeholder="New program name"
          className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleAddProgram}
          disabled={adding || !newProgName.trim()}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add Program'}
        </button>
      </div>
    </div>
  )
}

function ProgramCard({ program, orgId }: { program: Program; orgId: number }) {
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
  }

  async function handleUpdateName(value: string) {
    await updateProgram(orgId, program.id, { name: value })
    queryClient.invalidateQueries({ queryKey: ['programs', orgId] })
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 text-xs w-5"
        >
          {expanded ? '▼' : '▶'}
        </button>
        <div className="flex-1 min-w-0">
          <EditableField label="" value={program.name} onSave={handleUpdateName} canEdit={true} />
        </div>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleDelete} className="text-xs px-2 py-1 bg-red-600 text-white rounded">Confirm</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 border rounded">Cancel</button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 bg-gray-50 space-y-4">
          {/* Direct logframes (program without projects) */}
          <ProgramLogframesList orgId={orgId} programId={program.id} logframes={programLogframes ?? []} />

          {/* Projects under this program */}
          <ProjectsList orgId={orgId} programId={program.id} projects={projects ?? []} />
        </div>
      )}
    </div>
  )
}

function ProgramLogframesList({ orgId, programId, logframes }: { orgId: number; programId: number; logframes: Logframe[] }) {
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

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Logframes (direct)</p>
      {logframes.map((lf) => (
        <LogframeRow key={lf.id} logframe={lf} onDelete={() => handleDelete(lf.id)} />
      ))}
      {logframes.length === 0 && (
        <p className="text-[10px] text-gray-400 italic">No logframes directly under this program.</p>
      )}
      <div className="flex gap-1">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="Add logframe to program"
          className="flex-1 text-[10px] border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function ProjectsList({ orgId, programId, projects }: { orgId: number; programId: number; projects: Project[] }) {
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
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Projects</p>
      {projects.map((proj) => (
        <ProjectCard key={proj.id} project={proj} orgId={orgId} programId={programId} />
      ))}
      {projects.length === 0 && (
        <p className="text-xs text-gray-400 italic">No projects in this program.</p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="New project name"
          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function ProjectCard({ project, orgId, programId }: { project: Project; orgId: number; programId: number }) {
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
  }

  async function handleUpdateName(value: string) {
    await updateProject(orgId, programId, project.id, { name: value })
    queryClient.invalidateQueries({ queryKey: ['projects', orgId, programId] })
  }

  return (
    <div className="bg-white border rounded ml-4">
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 text-xs w-4">
          {expanded ? '▼' : '▶'}
        </button>
        <div className="flex-1 min-w-0">
          <EditableField label="" value={project.name} onSave={handleUpdateName} canEdit={true} />
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          project.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>{project.status}</span>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-[10px] text-red-400 hover:text-red-600">Delete</button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleDelete} className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded">Confirm</button>
            <button onClick={() => setConfirmDelete(false)} className="text-[10px] px-1.5 py-0.5 border rounded">Cancel</button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t px-3 py-2 bg-gray-50">
          <LogframesList orgId={orgId} programId={programId} projectId={project.id} logframes={logframes ?? []} />
        </div>
      )}
    </div>
  )
}

function LogframesList({ orgId, programId, projectId, logframes }: { orgId: number; programId: number; projectId: number; logframes: Logframe[] }) {
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

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Logframes</p>
      {logframes.map((lf) => (
        <LogframeRow key={lf.id} logframe={lf} onDelete={() => handleDelete(lf.id)} />
      ))}
      {logframes.length === 0 && (
        <p className="text-[10px] text-gray-400 italic">No logframes.</p>
      )}
      <div className="flex gap-1">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="New logframe name"
          className="flex-1 text-[10px] border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function LogframeRow({ logframe, onDelete }: { logframe: Logframe; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex items-center gap-2 bg-white border rounded px-2 py-1 ml-4">
      <a href={`/logframes/${logframe.id}`} className="text-xs text-blue-600 hover:underline flex-1 truncate">
        {logframe.name}
      </a>
      {!confirmDelete ? (
        <button onClick={() => setConfirmDelete(true)} className="text-[10px] text-red-400 hover:text-red-600">Delete</button>
      ) : (
        <div className="flex gap-1">
          <button onClick={onDelete} className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded">Confirm</button>
          <button onClick={() => setConfirmDelete(false)} className="text-[10px] px-1.5 py-0.5 border rounded">Cancel</button>
        </div>
      )}
    </div>
  )
}
