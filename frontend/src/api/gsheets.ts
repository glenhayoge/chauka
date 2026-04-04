import { apiClient } from './client'
import type {
  GoogleSheetsConnection,
  GoogleSheetsColumnMapping,
  GoogleSheetsSheetInfo,
  GoogleSheetsColumnInfo,
  GoogleSheetsSyncLog,
} from './types'

const base = (logframeId: number) => `/logframes/${logframeId}/gsheets`

// --- Connection ---

export async function getGSheetsConnection(logframeId: number): Promise<GoogleSheetsConnection | null> {
  const { data } = await apiClient.get<GoogleSheetsConnection | null>(`${base(logframeId)}/connection`)
  return data
}

export async function createGSheetsConnection(
  logframeId: number,
  body: { spreadsheet_id: string; sheet_name?: string; service_account_json: string },
): Promise<GoogleSheetsConnection> {
  const { data } = await apiClient.post<GoogleSheetsConnection>(`${base(logframeId)}/connection`, body)
  return data
}

export async function updateGSheetsConnection(
  logframeId: number,
  body: { spreadsheet_id?: string; sheet_name?: string; service_account_json?: string; is_active?: boolean },
): Promise<GoogleSheetsConnection> {
  const { data } = await apiClient.patch<GoogleSheetsConnection>(`${base(logframeId)}/connection`, body)
  return data
}

export async function deleteGSheetsConnection(logframeId: number): Promise<void> {
  await apiClient.delete(`${base(logframeId)}/connection`)
}

// --- Sheet discovery ---

export async function listGSheetsSheets(logframeId: number): Promise<GoogleSheetsSheetInfo[]> {
  const { data } = await apiClient.get<GoogleSheetsSheetInfo[]>(`${base(logframeId)}/sheets`)
  return data
}

export async function listGSheetsColumns(logframeId: number): Promise<GoogleSheetsColumnInfo[]> {
  const { data } = await apiClient.get<GoogleSheetsColumnInfo[]>(`${base(logframeId)}/columns`)
  return data
}

// --- Mappings ---

export async function listGSheetsMappings(logframeId: number): Promise<GoogleSheetsColumnMapping[]> {
  const { data } = await apiClient.get<GoogleSheetsColumnMapping[]>(`${base(logframeId)}/mappings`)
  return data
}

export async function createGSheetsMapping(
  logframeId: number,
  body: {
    sheet_column: string
    subindicator_id: number
    column_id?: number | null
    auto_create_column?: boolean
    aggregation?: string
  },
): Promise<GoogleSheetsColumnMapping> {
  const { data } = await apiClient.post<GoogleSheetsColumnMapping>(`${base(logframeId)}/mappings`, body)
  return data
}

export async function deleteGSheetsMapping(logframeId: number, mappingId: number): Promise<void> {
  await apiClient.delete(`${base(logframeId)}/mappings/${mappingId}`)
}

// --- Sync ---

export async function triggerGSheetsSync(logframeId: number): Promise<GoogleSheetsSyncLog> {
  const { data } = await apiClient.post<GoogleSheetsSyncLog>(`${base(logframeId)}/sync`)
  return data
}

export async function listGSheetsSyncLogs(logframeId: number): Promise<GoogleSheetsSyncLog[]> {
  const { data } = await apiClient.get<GoogleSheetsSyncLog[]>(`${base(logframeId)}/sync/logs`)
  return data
}
