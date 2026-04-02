import { apiClient } from './client'
import type {
  Invitation,
  InvitationPublic,
  Organisation,
  OrganisationCreate,
  OrganisationMembership,
  OrganisationMembershipCreate,
  Program,
  ProgramCreate,
  Project,
  ProjectCreate,
  ProjectRoleAssignment,
  ProjectRoleCreate,
  Logframe,
} from './types'

// --- Organisations ---

export async function getOrganisations(): Promise<Organisation[]> {
  const { data } = await apiClient.get<Organisation[]>('/organisations/')
  return data
}

export async function getOrganisation(orgId: number): Promise<Organisation> {
  const { data } = await apiClient.get<Organisation>(`/organisations/${orgId}`)
  return data
}

export async function createOrganisation(body: OrganisationCreate): Promise<Organisation> {
  const { data } = await apiClient.post<Organisation>('/organisations/', body)
  return data
}

export async function updateOrganisation(
  orgId: number,
  body: Partial<OrganisationCreate>,
): Promise<Organisation> {
  const { data } = await apiClient.patch<Organisation>(`/organisations/${orgId}`, body)
  return data
}

export async function updateProgram(
  orgId: number,
  programId: number,
  body: Partial<ProgramCreate>,
): Promise<Program> {
  const { data } = await apiClient.patch<Program>(`/organisations/${orgId}/programs/${programId}`, body)
  return data
}

export async function updateProject(
  orgId: number,
  programId: number,
  projectId: number,
  body: Partial<ProjectCreate>,
): Promise<Project> {
  const { data } = await apiClient.patch<Project>(
    `/organisations/${orgId}/programs/${programId}/projects/${projectId}`,
    body,
  )
  return data
}

export async function updateLogframe(
  logframeId: number,
  body: { name: string },
): Promise<Logframe> {
  const { data } = await apiClient.patch<Logframe>(`/app/logframes/${logframeId}`, body)
  return data
}

// --- Programs ---

export async function getPrograms(orgId: number): Promise<Program[]> {
  const { data } = await apiClient.get<Program[]>(
    `/organisations/${orgId}/programs/`
  )
  return data
}

export async function getProgram(orgId: number, programId: number): Promise<Program> {
  const { data } = await apiClient.get<Program>(
    `/organisations/${orgId}/programs/${programId}`
  )
  return data
}

export async function createProgram(orgId: number, body: ProgramCreate): Promise<Program> {
  const { data } = await apiClient.post<Program>(
    `/organisations/${orgId}/programs/`,
    body
  )
  return data
}

// --- Projects ---

export async function getProjects(orgId: number, programId: number): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>(
    `/organisations/${orgId}/programs/${programId}/projects/`
  )
  return data
}

export async function getProject(
  orgId: number,
  programId: number,
  projectId: number
): Promise<Project> {
  const { data } = await apiClient.get<Project>(
    `/organisations/${orgId}/programs/${programId}/projects/${projectId}`
  )
  return data
}

export async function createProject(
  orgId: number,
  programId: number,
  body: ProjectCreate
): Promise<Project> {
  const { data } = await apiClient.post<Project>(
    `/organisations/${orgId}/programs/${programId}/projects/`,
    body
  )
  return data
}

// --- Organisation Dashboard ---

export async function getOrgDashboard(orgId: number) {
  const { data } = await apiClient.get(`/organisations/${orgId}/dashboard`)
  return data
}

// --- Standalone org projects (no program) ---

export async function getOrgProjects(orgId: number): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>(`/organisations/${orgId}/projects/`)
  return data
}

export async function createOrgProject(orgId: number, body: ProjectCreate): Promise<Project> {
  const { data } = await apiClient.post<Project>(`/organisations/${orgId}/projects/`, body)
  return data
}

export async function getOrgProjectLogframes(orgId: number, projectId: number): Promise<Logframe[]> {
  const { data } = await apiClient.get<Logframe[]>(
    `/organisations/${orgId}/projects/${projectId}/logframes`
  )
  return data
}

export async function createOrgProjectLogframe(
  orgId: number,
  projectId: number,
  body: { name: string },
): Promise<Logframe> {
  const { data } = await apiClient.post<Logframe>(
    `/organisations/${orgId}/projects/${projectId}/logframes`,
    body,
  )
  return data
}

// --- Delete operations ---

export async function deleteProgram(orgId: number, programId: number): Promise<void> {
  await apiClient.delete(`/organisations/${orgId}/programs/${programId}`)
}

export async function deleteProject(
  orgId: number, programId: number, projectId: number,
): Promise<void> {
  await apiClient.delete(`/organisations/${orgId}/programs/${programId}/projects/${projectId}`)
}

export async function deleteLogframe(logframeId: number): Promise<void> {
  await apiClient.delete(`/logframes/${logframeId}`)
}

// --- Organisation Memberships ---

export async function getMembers(orgId: number): Promise<OrganisationMembership[]> {
  const { data } = await apiClient.get<OrganisationMembership[]>(
    `/organisations/${orgId}/members/`
  )
  return data
}

export async function addMember(
  orgId: number,
  body: OrganisationMembershipCreate
): Promise<OrganisationMembership> {
  const { data } = await apiClient.post<OrganisationMembership>(
    `/organisations/${orgId}/members/`,
    body
  )
  return data
}

export async function updateMemberRole(
  orgId: number,
  membershipId: number,
  body: OrganisationMembershipCreate
): Promise<OrganisationMembership> {
  const { data } = await apiClient.patch<OrganisationMembership>(
    `/organisations/${orgId}/members/${membershipId}`,
    body
  )
  return data
}

export async function removeMember(orgId: number, membershipId: number): Promise<void> {
  await apiClient.delete(`/organisations/${orgId}/members/${membershipId}`)
}

// --- Project Roles ---

export async function getProjectRoles(
  orgId: number,
  programId: number,
  projectId: number
): Promise<ProjectRoleAssignment[]> {
  const { data } = await apiClient.get<ProjectRoleAssignment[]>(
    `/organisations/${orgId}/programs/${programId}/projects/${projectId}/roles/`
  )
  return data
}

export async function assignProjectRole(
  orgId: number,
  programId: number,
  projectId: number,
  body: ProjectRoleCreate
): Promise<ProjectRoleAssignment> {
  const { data } = await apiClient.post<ProjectRoleAssignment>(
    `/organisations/${orgId}/programs/${programId}/projects/${projectId}/roles/`,
    body
  )
  return data
}

export async function updateProjectRole(
  orgId: number,
  programId: number,
  projectId: number,
  roleId: number,
  body: ProjectRoleCreate
): Promise<ProjectRoleAssignment> {
  const { data } = await apiClient.patch<ProjectRoleAssignment>(
    `/organisations/${orgId}/programs/${programId}/projects/${projectId}/roles/${roleId}`,
    body
  )
  return data
}

export async function removeProjectRole(
  orgId: number,
  programId: number,
  projectId: number,
  roleId: number
): Promise<void> {
  await apiClient.delete(
    `/organisations/${orgId}/programs/${programId}/projects/${projectId}/roles/${roleId}`
  )
}

export async function createLogframe(
  orgId: number,
  programId: number,
  projectId: number,
  body: {
    name: string
    start_year?: number
    end_year?: number
    start_month?: number
    n_periods?: number
    currency?: string
  },
): Promise<Logframe> {
  const { data } = await apiClient.post<Logframe>(
    `/organisations/${orgId}/programs/${programId}/projects/${projectId}/logframes`,
    body,
  )
  return data
}

export async function getProgramLogframes(
  orgId: number,
  programId: number,
): Promise<Logframe[]> {
  const { data } = await apiClient.get<Logframe[]>(
    `/organisations/${orgId}/programs/${programId}/logframes`
  )
  return data
}

export async function createProgramLogframe(
  orgId: number,
  programId: number,
  body: { name: string },
): Promise<Logframe> {
  const { data } = await apiClient.post<Logframe>(
    `/organisations/${orgId}/programs/${programId}/logframes`,
    body,
  )
  return data
}

export async function getProjectLogframes(
  orgId: number,
  programId: number,
  projectId: number
): Promise<Logframe[]> {
  const { data } = await apiClient.get<Logframe[]>(
    `/organisations/${orgId}/programs/${programId}/projects/${projectId}/logframes`
  )
  return data
}

// --- Invitations ---

export async function getInvitations(orgId: number): Promise<Invitation[]> {
  const { data } = await apiClient.get<Invitation[]>(`/organisations/${orgId}/invitations/`)
  return data
}

export async function createInvitation(
  orgId: number,
  body: { email: string; role?: string },
): Promise<Invitation> {
  const { data } = await apiClient.post<Invitation>(`/organisations/${orgId}/invitations/`, body)
  return data
}

export async function revokeInvitation(orgId: number, invitationId: number): Promise<void> {
  await apiClient.delete(`/organisations/${orgId}/invitations/${invitationId}`)
}

export async function getInvitationByToken(token: string): Promise<InvitationPublic> {
  const { data } = await apiClient.get<InvitationPublic>(`/invitations/${token}`)
  return data
}

export async function acceptInvitation(token: string): Promise<{ status: string; organisation_id: number }> {
  const { data } = await apiClient.post<{ status: string; organisation_id: number }>(`/invitations/${token}/accept`)
  return data
}
