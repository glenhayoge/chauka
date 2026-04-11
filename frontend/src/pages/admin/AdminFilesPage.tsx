export default function AdminFilesPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">File Uploads</h1>
      <p className="text-sm text-muted-foreground mt-4">
        Securely accept files from admins (e.g., ZIP microapp packages, logos, CSVs) with
        validation, scanning, and safe storage.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground text-sm font-medium">Coming Soon</p>
        <p className="text-muted-foreground/60 text-xs mt-1">This feature is planned for a future release.</p>
      </div>
    </div>
  )
}
