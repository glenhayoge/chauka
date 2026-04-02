import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { KoboConnection, KoboSyncLog } from '../../api/types'
import {
  getKoboConnection,
  createKoboConnection,
  deleteKoboConnection,
  triggerKoboSync,
  listKoboSyncLogs,
} from '../../api/kobo'

interface Props {
  logframeId: number
  canEdit: boolean
}

export default function KoboSettings({ logframeId, canEdit }: Props) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const { data: connection, isLoading } = useQuery({
    queryKey: ['kobo-connection', logframeId],
    queryFn: () => getKoboConnection(logframeId),
    enabled: expanded,
    retry: false,
  })

  if (!canEdit) return null

  return (
    <div className="bg-white border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            KoboToolBox Integration
          </span>
          {connection?.is_active && (
            <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded">
              Connected
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3">
          {isLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
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
  logframeId: number
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [serverUrl, setServerUrl] = useState('https://kf.kobotoolbox.org')
  const [apiToken, setApiToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!apiToken.trim()) return
    setSaving(true)
    setError('')
    try {
      await createKoboConnection(logframeId, {
        server_url: serverUrl,
        api_token: apiToken.trim(),
      })
      queryClient.invalidateQueries({ queryKey: ['kobo-connection', logframeId] })
    } catch {
      setError('Failed to connect. Check your API token.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleConnect} className="space-y-3">
      <p className="text-sm text-gray-600">
        Connect your KoboToolBox account to import form submissions as indicator data.
      </p>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Server URL</label>
        <input
          type="url"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="https://kf.kobotoolbox.org"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">API Token</label>
        <input
          type="password"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="Your KoboToolBox API token"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Find your token at Account Settings &rarr; Security &rarr; API Key
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving || !apiToken.trim()}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
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
  connection: KoboConnection
  logframeId: number
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<KoboSyncLog | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const { data: syncLogs } = useQuery({
    queryKey: ['kobo-sync-logs', logframeId],
    queryFn: () => listKoboSyncLogs(logframeId),
  })

  async function handleSync() {
    setSyncing(true)
    try {
      const log = await triggerKoboSync(logframeId)
      setLastSync(log)
      queryClient.invalidateQueries({ queryKey: ['kobo-sync-logs', logframeId] })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
    } catch {
      setLastSync({
        id: 0,
        connection_id: connection.id,
        synced_at: null,
        status: 'error',
        submissions_fetched: 0,
        entries_created: 0,
        entries_updated: 0,
        error_message: 'Sync failed',
      })
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    await deleteKoboConnection(logframeId)
    queryClient.invalidateQueries({ queryKey: ['kobo-connection', logframeId] })
    setConfirmDisconnect(false)
  }

  return (
    <div className="space-y-4">
      {/* Connection info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="text-sm">
          <span className="text-gray-500">Server:</span>{' '}
          <span className="text-gray-700 font-medium">{connection.server_url}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          {!confirmDisconnect ? (
            <button
              onClick={() => setConfirmDisconnect(true)}
              className="px-3 py-1.5 text-red-500 text-xs rounded border border-red-300 hover:bg-red-50"
            >
              Disconnect
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDisconnect(false)}
                className="px-3 py-1.5 text-gray-500 text-xs rounded border hover:bg-gray-50"
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

      {/* Field mappings placeholder */}
      <div className="border-t pt-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Field Mappings
        </h4>
        <p className="text-sm text-gray-400 italic">
          Field mapping configuration will be available in a future update.
          Use the API to create mappings between KoboToolBox form fields and Chauka indicators.
        </p>
      </div>

      {/* Sync history */}
      {syncLogs && syncLogs.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
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

function SyncResult({ log, compact }: { log: KoboSyncLog; compact?: boolean }) {
  const statusColor = log.status === 'success'
    ? 'text-green-700 bg-green-50'
    : log.status === 'error'
      ? 'text-red-700 bg-red-50'
      : 'text-yellow-700 bg-yellow-50'

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className={`px-1.5 py-0.5 rounded font-medium ${statusColor}`}>
          {log.status}
        </span>
        {log.synced_at && (
          <span>{new Date(log.synced_at).toLocaleString()}</span>
        )}
        <span>{log.submissions_fetched} fetched</span>
        <span>{log.entries_created} created</span>
        <span>{log.entries_updated} updated</span>
      </div>
    )
  }

  return (
    <div className={`text-sm rounded p-2 ${statusColor}`}>
      <span className="font-medium capitalize">{log.status}</span>
      {' — '}
      {log.submissions_fetched} submissions fetched,
      {' '}{log.entries_created} entries created,
      {' '}{log.entries_updated} updated
      {log.error_message && (
        <p className="text-xs mt-1">{log.error_message}</p>
      )}
    </div>
  )
}
