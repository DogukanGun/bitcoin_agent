"use client";

import { useState } from "react";
import { getNonceForAddress, loginWithSignature, verifyToken } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/spinner";

export default function AuthLoginPage() {
  const [step, setStep] = useState<"address" | "sign" | "complete">("address");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleGetNonce = async () => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      setError("Invalid Ethereum address format");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await getNonceForAddress(address);

    if (response.error) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    if (response.data) {
      setMessage(response.data.message);
      setStep("sign");
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    if (!signature) {
      setError("Signature is required");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await loginWithSignature({ address, message, signature });

    if (response.error) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    if (response.data) {
      setToken(response.data.token);
      localStorage.setItem("payguard_token", response.data.token);
      setStep("complete");
    }

    setLoading(false);
  };

  const handleVerify = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const response = await verifyToken(token);

    if (response.error) {
      setError(response.error.message);
    } else if (response.data?.valid) {
      setError(null);
    } else {
      setError("Token is invalid or expired");
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Authentication</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Test signature-based login flows for wallet authentication.
        </p>
      </div>

      {step === "address" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Get nonce</CardTitle>
            <CardDescription>Request a message to sign from the backend.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Wallet address</Label>
                <Input
                  id="address"
                  placeholder="0x..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGetNonce()}
                />
              </div>
              {error && (
                <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
                  {error}
                </div>
              )}
              <Button onClick={handleGetNonce} disabled={loading}>
                {loading ? <Spinner label="Fetching nonce" /> : "Get nonce"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "sign" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Sign message</CardTitle>
            <CardDescription>
              Sign the nonce with your wallet then paste the resulting signature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Message to sign</Label>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
                  {message}
                </pre>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature">Signature</Label>
                <Input
                  id="signature"
                  placeholder="0x..."
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              {error && (
                <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={handleLogin} disabled={loading}>
                  {loading ? <Spinner label="Logging in" /> : "Login"}
                </Button>
                <Button variant="outline" onClick={() => setStep("address")}>
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "complete" && token && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Step 3: Complete</CardTitle>
                <CardDescription>Token issued and stored in localStorage.</CardDescription>
              </div>
              <Badge variant="success">Authenticated</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>JWT token</Label>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
                  {token}
                </pre>
              </div>
              {error && (
                <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={handleVerify} disabled={loading}>
                  {loading ? <Spinner label="Verifying" /> : "Verify token"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("address");
                    setAddress("");
                    setMessage("");
                    setSignature("");
                    setToken(null);
                    setError(null);
                    localStorage.removeItem("payguard_token");
                  }}
                >
                  Restart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
