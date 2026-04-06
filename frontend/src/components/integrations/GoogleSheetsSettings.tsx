import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { GoogleSheetsConnection, GoogleSheetsSyncLog } from '../../api/types'
import {
  getGSheetsConnection,
  createGSheetsConnection,
  deleteGSheetsConnection,
  triggerGSheetsSync,
  listGSheetsSyncLogs,
} from '../../api/gsheets'

interface Props {
  logframeId: string
  canEdit: boolean
}

export default function GoogleSheetsSettings({ logframeId, canEdit }: Props) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const { data: connection, isLoading } = useQuery({
    queryKey: ['gsheets-connection', logframeId],
    queryFn: () => getGSheetsConnection(logframeId),
    enabled: expanded,
    retry: false,
  })

  if (!canEdit) return null

  return (
    <div className="bg-card border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Google Sheets Integration
          </span>
          {connection?.is_active && (
            <span className="inline-block bg-ok/10 text-ok text-xs font-medium px-2 py-0.5 rounded">
              Connected
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : connection ? (
            <ConnectedView
              connection={connection}
              logframeId={logframeId}
              queryClient={queryClient}
            />
          ) : (
            <SetupView logframeId={logframeId} queryClient={queryClient} />
          )}
        </div>
      )}
    </div>
  )
}

function SetupView({
  logframeId,
  queryClient,
}: {
  logframeId: string
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [serviceAccountJson, setServiceAccountJson] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function extractSpreadsheetId(input: string): string {
    // Accept full URL or just the ID
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : input.trim()
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    const id = extractSpreadsheetId(spreadsheetId)
    if (!id || !serviceAccountJson.trim()) return

    // Validate JSON
    try {
      JSON.parse(serviceAccountJson)
    } catch {
      setError('Invalid JSON. Paste the full service account key file contents.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createGSheetsConnection(logframeId, {
        spreadsheet_id: id,
        sheet_name: sheetName || undefined,
        service_account_json: serviceAccountJson.trim(),
      })
      queryClient.invalidateQueries({ queryKey: ['gsheets-connection', logframeId] })
    } catch {
      setError('Failed to connect. Check your spreadsheet ID and service account credentials.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleConnect} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect a Google Sheet to import data into your indicators. Uses a service account for authentication —
        share your spreadsheet with the service account email.
      </p>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Spreadsheet ID or URL
        </label>
        <input
          type="text"
          value={spreadsheetId}
          onChange={(e) => setSpreadsheetId(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Paste spreadsheet URL or ID"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          e.g. https://docs.google.com/spreadsheets/d/1BxiM.../edit
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Sheet name (optional)
        </label>
        <input
          type="text"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Sheet1 (default)"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Service Account JSON Key
        </label>
        <textarea
          value={serviceAccountJson}
          onChange={(e) => setServiceAccountJson(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          rows={4}
          placeholder='Paste the contents of your service account .json key file'
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Create a service account in Google Cloud Console &rarr; IAM &rarr; Service Accounts.
          Share your spreadsheet with the service account email address.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={saving || !spreadsheetId.trim() || !serviceAccountJson.trim()}
        className="px-4 py-2 bg-primary text-background text-sm rounded hover:bg-primary/80 disabled:opacity-50"
      >
        {saving ? 'Connecting…' : 'Connect'}
      </button>
    </form>
  )
}

function ConnectedView({
  connection,
  logframeId,
  queryClient,
}: {
  connection: GoogleSheetsConnection
  logframeId: string
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<GoogleSheetsSyncLog | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const { data: syncLogs } = useQuery({
    queryKey: ['gsheets-sync-logs', logframeId],
    queryFn: () => listGSheetsSyncLogs(logframeId),
  })

  async function handleSync() {
    setSyncing(true)
    try {
      const log = await triggerGSheetsSync(logframeId)
      setLastSync(log)
      queryClient.invalidateQueries({ queryKey: ['gsheets-sync-logs', logframeId] })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
    } catch {
      setLastSync({
        id: 0,
        connection_id: connection.id,
        synced_at: null,
        status: 'error',
        rows_fetched: 0,
        entries_created: 0,
        entries_updated: 0,
        error_message: 'Sync failed',
      })
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    await deleteGSheetsConnection(logframeId)
    queryClient.invalidateQueries({ queryKey: ['gsheets-connection', logframeId] })
    setConfirmDisconnect(false)
  }

  return (
    <div className="space-y-4">
      {/* Connection info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="text-sm min-w-0">
          <span className="text-muted-foreground">Spreadsheet:</span>{' '}
          <span className="text-foreground font-medium break-all">{connection.spreadsheet_id}</span>
          {connection.sheet_name && (
            <>
              <span className="text-muted-foreground ml-2">Sheet:</span>{' '}
              <span className="text-foreground font-medium">{connection.sheet_name}</span>
            </>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 bg-primary text-background text-xs rounded hover:bg-primary/80 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          {!confirmDisconnect ? (
            <button
              onClick={() => setConfirmDisconnect(true)}
              className="px-3 py-1.5 text-destructive text-xs rounded border border-destructive/30 hover:bg-destructive/10"
            >
              Disconnect
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 bg-destructive text-background text-xs rounded hover:bg-destructive/80"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDisconnect(false)}
                className="px-3 py-1.5 text-muted-foreground text-xs rounded border hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Last sync result */}
      {lastSync && (
        <SyncResult log={lastSync} />
      )}

      {/* Column mappings placeholder */}
      <div className="border-t pt-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Column Mappings
        </h4>
        <p className="text-sm text-muted-foreground italic">
          Column mapping configuration will be available in a future update.
          Use the API to create mappings between Google Sheets columns and Chauka indicators.
        </p>
      </div>

      {/* Sync history */}
      {syncLogs && syncLogs.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Recent Syncs
          </h4>
          <div className="space-y-1">
            {syncLogs.slice(0, 5).map((log) => (
              <SyncResult key={log.id} log={log} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SyncResult({ log, compact }: { log: GoogleSheetsSyncLog; compact?: boolean }) {
  const statusColor = log.status === 'success'
    ? 'text-ok bg-ok/10'
    : log.status === 'error'
      ? 'text-destructive bg-destructive/10'
      : 'text-warning bg-warning/10'

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`px-1.5 py-0.5 rounded font-medium ${statusColor}`}>
          {log.status}
        </span>
        {log.synced_at && (
          <span>{new Date(log.synced_at).toLocaleString()}</span>
        )}
        <span>{log.rows_fetched} rows</span>
        <span>{log.entries_created} created</span>
        <span>{log.entries_updated} updated</span>
      </div>
    )
  }

  return (
    <div className={`text-sm rounded p-2 ${statusColor}`}>
      <span className="font-medium capitalize">{log.status}</span>
      {' — '}
      {log.rows_fetched} rows fetched,
      {' '}{log.entries_created} entries created,
      {' '}{log.entries_updated} updated
      {log.error_message && (
        <p className="text-xs mt-1">{log.error_message}</p>
      )}
    </div>
  )
}
