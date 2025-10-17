import { Suspense } from "react";
import { getHealthSummary, listProviders } from "@/lib/api";
import type { Provider } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/spinner";

async function ProviderSnapshot() {
  const response = await listProviders({ limit: 5 });

  if (response.error || !response.data) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>
            Failed to load providers. Ensure MongoDB is configured for the backend.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Providers</CardTitle>
        <CardDescription>Latest onboarded partners</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {response.data.data.map((provider: Provider) => (
            <li key={provider.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.address}</p>
              </div>
              <Badge variant={provider.verified ? "success" : "outline"}>
                {provider.verified ? "Verified" : "Pending"}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

async function HealthSnapshot() {
  const health = await getHealthSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle>API status</CardTitle>
        <CardDescription>Fastify readiness and uptime metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {health.error || !health.data ? (
          <div className="space-y-2 text-sm text-rose-500">
            <p>Health endpoint is unreachable.</p>
            <p className="text-muted-foreground">
              {health.error?.message || "Confirm backend is running on port 3001."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Status</p>
              <p className="mt-1 text-lg font-semibold text-emerald-500">
                {health.data.status}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Uptime</p>
              <p className="mt-1 text-lg font-semibold">
                {Math.round(health.data.uptime)} seconds
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Last heartbeat</p>
              <p className="mt-1 text-lg font-semibold">
                {new Date(health.data.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Operations dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Snapshot of PayGuard services backed by Fastify, MongoDB, and the smart contract suite.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Card className="flex min-h-[180px] items-center justify-center"><Spinner label="Loading providers" /></Card>}>
          <ProviderSnapshot />
        </Suspense>
        <Suspense fallback={<Card className="flex min-h-[180px] items-center justify-center"><Spinner label="Checking health" /></Card>}>
          <HealthSnapshot />
        </Suspense>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>
            Feed an address into the subscriptions explorer, then use analytics to validate post-trade metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>1. Gather wallet data through the Auth page and capture the issued JWT token.</li>
            <li>2. Register or import a provider to appear in the directory.</li>
            <li>3. Craft a subscription agreement and confirm it on-chain via the SubscriptionFactory.</li>
            <li>4. Inspect payments and analytics to monitor revenue behavior.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
