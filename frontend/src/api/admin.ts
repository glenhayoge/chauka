import { apiClient } from './client'
import type {
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  PaginatedUsers,
  PlatformDashboard,
  AuditLogEntry,
  AdminOrg,
  PaginatedOrgs,
  PermissionDef,
  RolePermissionSummary,
} from './types'

// --- Platform Dashboard ---

export async function getPlatformDashboard(): Promise<PlatformDashboard> {
  const { data } = await apiClient.get('/admin/dashboard/')
  return data
}

export async function getPlatformAuditLog(params?: {
  entity_type?: string
  action?: string
  limit?: number
  offset?: number
}): Promise<AuditLogEntry[]> {
  const { data } = await apiClient.get('/admin/dashboard/audit-log', { params })
  return data
}

// --- Admin Users ---

export async function getAdminUsers(params?: {
  page?: number
  page_size?: number
  search?: string
  is_active?: boolean
  sort?: string
}): Promise<PaginatedUsers> {
  const { data } = await apiClient.get('/admin/users/', { params })
  return data
}

export async function getAdminUser(userId: number): Promise<AdminUser> {
  const { data } = await apiClient.get(`/admin/users/${userId}`)
  return data
}

export async function createAdminUser(body: AdminUserCreate): Promise<AdminUser> {
  const { data } = await apiClient.post('/admin/users/', body)
  return data
}

export async function updateAdminUser(userId: number, body: AdminUserUpdate): Promise<AdminUser> {
  const { data } = await apiClient.patch(`/admin/users/${userId}`, body)
  return data
}

export async function deactivateAdminUser(userId: number): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}`)
}

export async function adminResetPassword(userId: number): Promise<{ message: string; reset_link: string }> {
  const { data } = await apiClient.post(`/admin/users/${userId}/reset-password`)
  return data
}

// --- Admin Organisations ---

export async function getAdminOrgs(params?: {
  page?: number
  page_size?: number
  search?: string
}): Promise<PaginatedOrgs> {
  const { data } = await apiClient.get('/admin/organisations/', { params })
  return data
}

export async function getAdminOrg(orgId: number): Promise<AdminOrg> {
  const { data } = await apiClient.get(`/admin/organisations/${orgId}`)
  return data
}

export async function updateAdminOrg(orgId: number, body: Record<string, unknown>): Promise<AdminOrg> {
  const { data } = await apiClient.patch(`/admin/organisations/${orgId}`, body)
  return data
}

export async function deleteAdminOrg(orgId: number): Promise<void> {
  await apiClient.delete(`/admin/organisations/${orgId}`)
}

// --- Admin RBAC ---

export async function getRoles(): Promise<RolePermissionSummary[]> {
  const { data } = await apiClient.get('/admin/rbac/roles')
  return data
}

export async function getPermissions(): Promise<PermissionDef[]> {
  const { data } = await apiClient.get('/admin/rbac/permissions')
  return data
}

export async function createPermission(body: { codename: string; name: string; description?: string; category?: string }): Promise<PermissionDef> {
  const { data } = await apiClient.post('/admin/rbac/permissions', body)
  return data
}

export async function setRolePermissions(role: string, permissions: string[]): Promise<RolePermissionSummary> {
  const { data } = await apiClient.put(`/admin/rbac/roles/${role}/permissions`, { permissions })
  return data
}
