"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerProvider } from "@/lib/api";
import type { ProviderRegistrationInput } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";

export default function RegisterProviderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProviderRegistrationInput>({
    address: "",
    name: "",
    description: "",
    website: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("payguard_token");
    const response = await registerProvider(formData, token || undefined);

    if (response.error) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    router.push(`/providers/${response.data?.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Register provider</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Onboard a new subscription service provider. This requires a valid Bearer token.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider information</CardTitle>
          <CardDescription>Enter wallet address and service metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Wallet address *</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                required
                pattern="^0x[a-fA-F0-9]{40}$"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Provider name *</Label>
              <Input
                id="name"
                placeholder="e.g., Acme Subscriptions"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                minLength={1}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Summarize the subscription offering…"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, website: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner label="Registering" /> : "Register provider"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
