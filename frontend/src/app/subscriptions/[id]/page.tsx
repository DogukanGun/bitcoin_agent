import { notFound } from "next/navigation";
import { getSubscriptionById } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await getSubscriptionById(id);

  if (response.error || !response.data) {
    notFound();
  }

  const sub = response.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Subscription details</h1>
        <p className="mt-2 break-all text-sm text-muted-foreground">{sub.contractAddress}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Agreement terms</CardTitle>
              <CardDescription>Retrieved from on-chain SubscriptionContract</CardDescription>
            </div>
            <Badge
              variant={
                sub.status === "ACTIVE"
                  ? "success"
                  : sub.status === "PAUSED"
                    ? "warning"
                    : "danger"
              }
            >
              {sub.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Agreement ID</p>
            <p className="mt-1 font-mono text-sm">{sub.agreementId}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">User</p>
            <p className="mt-1 break-all font-mono text-sm">{sub.userId}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Provider</p>
            <p className="mt-1 break-all font-mono text-sm">{sub.providerAddress}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Token</p>
            <p className="mt-1 break-all font-mono text-sm">{sub.tokenAddress}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Amount</p>
            <p className="mt-1 text-sm font-semibold">{sub.amount}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Period</p>
            <p className="mt-1 text-sm">{sub.period} seconds</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Next payment due</p>
            <p className="mt-1 text-sm">{new Date(sub.nextPaymentDue).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Total paid</p>
            <p className="mt-1 text-sm font-semibold">{sub.totalPaid}</p>
          </div>
          {sub.totalFromPool && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total from pool</p>
              <p className="mt-1 text-sm">{sub.totalFromPool}</p>
            </div>
          )}
          {sub.currentPeriod !== undefined && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Current period</p>
              <p className="mt-1 text-sm">{sub.currentPeriod}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use the payment processing endpoint to simulate a manual charge</li>
            <li>• Cancel this subscription via the backend cancellation route</li>
            <li>• Review the ReservePool balance and coverage percentage</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
