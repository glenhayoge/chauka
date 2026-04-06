import { apiClient } from './client'
import type {
  KoboConnection,
  KoboFieldMapping,
  KoboFormSummary,
  KoboFormField,
  KoboSyncLog,
} from './types'

const base = (logframeId: string) => `/logframes/${logframeId}/kobo`

// --- Connection ---

export async function getKoboConnection(logframeId: string): Promise<KoboConnection | null> {
  const { data } = await apiClient.get<KoboConnection | null>(`${base(logframeId)}/connection`)
  return data
}

export async function createKoboConnection(
  logframeId: string,
  body: { server_url?: string; api_token: string },
): Promise<KoboConnection> {
  const { data } = await apiClient.post<KoboConnection>(`${base(logframeId)}/connection`, body)
  return data
}

export async function updateKoboConnection(
  logframeId: string,
  body: { server_url?: string; api_token?: string; is_active?: boolean },
): Promise<KoboConnection> {
  const { data } = await apiClient.patch<KoboConnection>(`${base(logframeId)}/connection`, body)
  return data
}

export async function deleteKoboConnection(logframeId: string): Promise<void> {
  await apiClient.delete(`${base(logframeId)}/connection`)
}

// --- Forms ---

export async function listKoboForms(logframeId: string): Promise<KoboFormSummary[]> {
  const { data } = await apiClient.get<KoboFormSummary[]>(`${base(logframeId)}/forms`)
  return data
}

export async function getKoboFormFields(
  logframeId: string,
  formUid: string,
): Promise<KoboFormField[]> {
  const { data } = await apiClient.get<KoboFormField[]>(
    `${base(logframeId)}/forms/${formUid}/fields`,
  )
  return data
}

// --- Mappings ---

export async function listKoboMappings(logframeId: string): Promise<KoboFieldMapping[]> {
  const { data } = await apiClient.get<KoboFieldMapping[]>(`${base(logframeId)}/mappings`)
  return data
}

export async function createKoboMapping(
  logframeId: string,
  body: {
    kobo_form_id: string
    kobo_field_name: string
    subindicator_id: number
    column_id?: number | null
    auto_create_column?: boolean
    aggregation?: string
  },
): Promise<KoboFieldMapping> {
  const { data } = await apiClient.post<KoboFieldMapping>(`${base(logframeId)}/mappings`, body)
  return data
}

export async function deleteKoboMapping(logframeId: string, mappingId: number): Promise<void> {
  await apiClient.delete(`${base(logframeId)}/mappings/${mappingId}`)
}

// --- Sync ---

export async function triggerKoboSync(logframeId: string): Promise<KoboSyncLog> {
  const { data } = await apiClient.post<KoboSyncLog>(`${base(logframeId)}/sync`)
  return data
}

export async function listKoboSyncLogs(logframeId: string): Promise<KoboSyncLog[]> {
  const { data } = await apiClient.get<KoboSyncLog[]>(`${base(logframeId)}/sync/logs`)
  return data
}
