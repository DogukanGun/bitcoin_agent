"use client";

import { useState } from "react";
import Link from "next/link";
import { listSubscriptions } from "@/lib/api";
import type { Subscription } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/spinner";

export default function SubscriptionsPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      setError("Invalid Ethereum address format");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await listSubscriptions({ userAddress: address });

    if (response.error) {
      setError(response.error.message);
      setSubscriptions(null);
    } else if (response.data) {
      setSubscriptions(response.data.data);
      setError(null);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Subscriptions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          List subscription contracts for a given wallet address.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Address search</CardTitle>
          <CardDescription>
            Query the SubscriptionFactory for user subscriptions on Mezo chain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Spinner label="Searching" /> : "Search"}
            </Button>
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {subscriptions && (
        <>
          {subscriptions.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>No subscriptions found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The factory returned zero addresses for this wallet. Create a new subscription to
                  see results.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {subscriptions.map((sub) => (
                <Link key={sub.id} href={`/subscriptions/${sub.contractAddress}`}>
                  <Card className="transition hover:border-primary/60 hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {sub.providerAddress.slice(0, 10)}…
                        </CardTitle>
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
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Contract</p>
                        <p className="mt-1 break-all font-mono text-xs">{sub.contractAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Amount</p>
                        <p className="mt-1 text-sm font-semibold">{sub.amount} tokens</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Next payment</p>
                        <p className="mt-1 text-sm">
                          {new Date(sub.nextPaymentDue).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
