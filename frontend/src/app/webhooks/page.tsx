"use client";

import { useState, useEffect } from "react";
import { listWebhooks, registerWebhook } from "@/lib/api";
import type { Webhook } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/spinner";

export default function WebhooksPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[] | null>(null);

  // Registration form state
  const [registerUrl, setRegisterUrl] = useState("");
  const [registerEvents, setRegisterEvents] = useState("subscription.created,payment.processed");

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    setLoading(true);
    const response = await listWebhooks();

    if (response.error) {
      setError(response.error.message);
    } else if (response.data) {
      setWebhooks(response.data.data);
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    if (!registerUrl) {
      setError("Webhook URL is required");
      return;
    }

    setLoading(true);
    setError(null);

    const events = registerEvents.split(",").map((e) => e.trim());
    const response = await registerWebhook({ url: registerUrl, events });

    if (response.error) {
      setError(response.error.message);
    } else {
      setRegisterUrl("");
      setRegisterEvents("subscription.created,payment.processed");
      await fetchWebhooks();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Webhooks</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Register and manage webhook endpoints for subscription and payment events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register new webhook</CardTitle>
          <CardDescription>POST /api/webhooks/register</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://example.com/webhook"
                value={registerUrl}
                onChange={(e) => setRegisterUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-events">Events (comma-separated)</Label>
              <Input
                id="webhook-events"
                placeholder="subscription.created, payment.processed"
                value={registerEvents}
                onChange={(e) => setRegisterEvents(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}
            <Button onClick={handleRegister} disabled={loading}>
              {loading ? <Spinner label="Registering" /> : "Register webhook"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered webhooks</CardTitle>
          <CardDescription>GET /api/webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !webhooks ? (
            <Spinner label="Loading webhooks" />
          ) : error && !webhooks ? (
            <div className="text-sm text-rose-500">{error}</div>
          ) : webhooks && webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No webhooks registered. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {webhooks?.map((webhook) => (
                <div
                  key={webhook.id}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <p className="break-all text-sm font-medium">{webhook.url}</p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
