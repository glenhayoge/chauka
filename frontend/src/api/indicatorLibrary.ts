import { apiClient } from './client'
import type {
  Indicator,
  LibraryIndicator,
  LibraryIndicatorSearchResult,
  LibrarySector,
} from './types'

export async function searchLibraryIndicators(params: {
  q?: string
  sector?: string
  result_level?: string
  framework?: string
  organisation_id?: number
  page?: number
  page_size?: number
}): Promise<LibraryIndicatorSearchResult> {
  const { data } = await apiClient.get<LibraryIndicatorSearchResult>(
    '/indicator-library/',
    { params },
  )
  return data
}

export async function getLibraryIndicator(id: number): Promise<LibraryIndicator> {
  const { data } = await apiClient.get<LibraryIndicator>(`/indicator-library/${id}`)
  return data
}

export async function createLibraryIndicator(
  body: Omit<LibraryIndicator, 'id' | 'is_active' | 'created_at'> & { organisation_id: number },
): Promise<LibraryIndicator> {
  const { data } = await apiClient.post<LibraryIndicator>('/indicator-library/', body)
  return data
}

export async function updateLibraryIndicator(
  id: number,
  body: Partial<LibraryIndicator>,
): Promise<LibraryIndicator> {
  const { data } = await apiClient.patch<LibraryIndicator>(`/indicator-library/${id}`, body)
  return data
}

export async function deleteLibraryIndicator(id: number): Promise<void> {
  await apiClient.delete(`/indicator-library/${id}`)
}

export async function useLibraryIndicator(
  id: number,
  body: { logframe_public_id: string; result_id: number },
): Promise<Indicator> {
  const { data } = await apiClient.post<Indicator>(`/indicator-library/${id}/use`, body)
  return data
}

export async function getLibrarySectors(): Promise<LibrarySector[]> {
  const { data } = await apiClient.get<LibrarySector[]>('/indicator-library/sectors/')
  return data
}
