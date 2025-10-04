export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Quick links and recent activity.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <a href="/home" className="rounded-lg border p-4 hover:bg-muted">
          Go to Home
        </a>
        <a href="/lab" className="rounded-lg border p-4 hover:bg-muted">
          Open Lab
        </a>
        <a href="/library" className="rounded-lg border p-4 hover:bg-muted">
          Open Library
        </a>
      </div>
    </div>
  );
}


