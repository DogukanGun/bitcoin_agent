"use client";

import { useState } from "react";
import { getAnalytics } from "@/lib/api";
import type { AnalyticsPoint } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/spinner";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsPoint[] | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    const response = await getAnalytics({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      groupBy,
    });

    if (response.error) {
      setError(response.error.message);
    } else if (response.data) {
      setData(response.data.data);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Time-series metrics for subscriptions, payments, and volume.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query analytics</CardTitle>
          <CardDescription>GET /api/analytics with date and grouping filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-by">Group by</Label>
              <Select
                id="group-by"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as "day" | "week" | "month")}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </Select>
            </div>
            {error && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}
            <Button onClick={handleFetch} disabled={loading}>
              {loading ? <Spinner label="Fetching analytics" /> : "Fetch analytics"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {data.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>No analytics data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No data points returned for the selected range. Check backend implementation or seed sample data.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>{data.length} data points retrieved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.map((point, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Date</p>
                        <p className="text-sm font-medium">{point.date}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Subscriptions</p>
                        <p className="text-sm font-semibold">{point.subscriptions}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Payments</p>
                        <p className="text-sm font-semibold">{point.payments}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Volume</p>
                        <p className="text-sm font-semibold">{point.volume}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
