import { notFound } from "next/navigation";
import { getProviderById } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await getProviderById(id);

  if (response.error || !response.data) {
    notFound();
  }

  const provider = response.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">{provider.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Provider profile and registration metadata
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Core details</CardTitle>
              <CardDescription>Data stored in MongoDB for this provider</CardDescription>
            </div>
            <Badge variant={provider.verified ? "success" : "outline"}>
              {provider.verified ? "Verified" : "Pending"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Wallet address</p>
            <p className="mt-1 break-all font-mono text-sm">{provider.address}</p>
          </div>
          {provider.description && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Description</p>
              <p className="mt-1 text-sm">{provider.description}</p>
            </div>
          )}
          {provider.website && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Website</p>
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-primary underline"
              >
                {provider.website}
              </a>
            </div>
          )}
          {provider.email && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Email</p>
              <p className="mt-1 text-sm">{provider.email}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase text-muted-foreground">Registered</p>
            <p className="mt-1 text-sm">{new Date(provider.createdAt).toLocaleString()}</p>
          </div>
          {provider.updatedAt && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Last updated</p>
              <p className="mt-1 text-sm">{new Date(provider.updatedAt).toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Next actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Query subscriptions that reference this provider address</li>
            <li>• Use provider analytics endpoint to confirm active agreement count</li>
            <li>• Update provider metadata with a PUT request (requires Auth token)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
