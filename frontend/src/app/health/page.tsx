import { getHealthSummary, getHealthDetailed } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HealthPage() {
  const [summary, detailed] = await Promise.all([getHealthSummary(), getHealthDetailed()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Health & status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fastify server readiness and subsystem checks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Basic health check</CardTitle>
              <CardDescription>GET /api/health</CardDescription>
            </div>
            {summary.data && (
              <Badge variant={summary.data.status === "healthy" ? "success" : "danger"}>
                {summary.data.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {summary.error ? (
            <div className="text-sm text-rose-500">
              <p>{summary.error.message}</p>
              <p className="mt-2 text-muted-foreground">
                Confirm the backend is running on port 3001.
              </p>
            </div>
          ) : summary.data ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Status</p>
                <p className="mt-1 text-lg font-semibold text-emerald-500">
                  {summary.data.status}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Uptime</p>
                <p className="mt-1 text-lg font-semibold">{Math.round(summary.data.uptime)}s</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Timestamp</p>
                <p className="mt-1 text-lg font-semibold">
                  {new Date(summary.data.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Detailed health check</CardTitle>
              <CardDescription>GET /api/health/detailed</CardDescription>
            </div>
            {detailed.data && (
              <Badge variant={detailed.data.status === "healthy" ? "success" : "danger"}>
                {detailed.data.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {detailed.error ? (
            <div className="text-sm text-rose-500">
              <p>{detailed.error.message}</p>
            </div>
          ) : detailed.data ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Version</p>
                  <p className="mt-1 text-sm">{detailed.data.version || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Uptime</p>
                  <p className="mt-1 text-sm">{Math.round(detailed.data.uptime)}s</p>
                </div>
              </div>
              {detailed.data.checks && (
                <div>
                  <p className="mb-2 text-xs uppercase text-muted-foreground">Subsystem checks</p>
                  <div className="space-y-2">
                    {Object.entries(detailed.data.checks).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{key}</span>
                        <Badge variant={value ? "success" : "danger"}>
                          {value ? "Operational" : "Down"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
