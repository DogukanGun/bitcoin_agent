import Link from "next/link";
import { listProviders } from "@/lib/api";
import type { Provider } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ProvidersPage() {
  const response = await listProviders({ limit: 50 });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Providers</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Directory of subscription service providers verified on the platform.
          </p>
        </div>
        <Link href="/providers/register">
          <Button>Register provider</Button>
        </Link>
      </div>

      {response.error || !response.data ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Unable to load providers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {response.error?.message ||
                "Backend returned empty response. Ensure MongoDB is connected."}
            </p>
          </CardContent>
        </Card>
      ) : response.data.data.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No providers found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Register the first provider to start listing subscription partners.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {response.data.data.map((provider: Provider) => (
            <Link key={provider.id} href={`/providers/${provider.id}`}>
              <Card className="transition hover:border-primary/60 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <Badge variant={provider.verified ? "success" : "outline"}>
                      {provider.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="break-all text-xs text-muted-foreground">{provider.address}</p>
                  {provider.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {provider.description}
                    </p>
                  )}
                  {provider.website && (
                    <p className="text-xs text-primary underline">{provider.website}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
