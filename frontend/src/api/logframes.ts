import { apiClient } from './client'
import type { BootstrapData, Logframe, UserSummary } from './types'

export async function getLogframes(): Promise<Logframe[]> {
  const { data } = await apiClient.get<Logframe[]>('/logframes/')
  return data
}

export async function getBootstrap(logframeId: string): Promise<BootstrapData> {
  const { data } = await apiClient.get<BootstrapData>(`/logframes/${logframeId}/bootstrap`)
  return data
}

export async function getUsers(): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>('/users/')
  return data
}

export async function searchUsers(query: string): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>('/users/search', { params: { q: query } })
  return data
}
