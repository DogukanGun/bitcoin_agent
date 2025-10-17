import { listPlans } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PlansPage() {
  const response = await listPlans();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Subscription plans</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Predefined subscription tier offerings for users and providers.
        </p>
      </div>

      {response.error || !response.data ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Plans endpoint not implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {response.error?.message ||
                "Backend returns 501. Implement the plans route to see data here."}
            </p>
          </CardContent>
        </Card>
      ) : response.data.data.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No plans configured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define plans in the backend or seed database to populate this listing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {response.data.data.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.active !== undefined && (
                    <Badge variant={plan.active ? "success" : "outline"}>
                      {plan.active ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
                <CardDescription>Amount: {plan.amount}</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Period</p>
                  <p className="mt-1 text-sm">{plan.period} seconds</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
