"use client";

import { useState } from "react";
import { getPaymentQuote, processPayment } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/spinner";

export default function PaymentsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<{
    subscriptionId: string;
    amount: string;
    gasEstimate: string;
    totalCost: string;
  } | null>(null);
  const [processResult, setProcessResult] = useState<{
    transactionHash: string;
    success: boolean;
  } | null>(null);

  // Quote form state
  const [quoteSubscriptionId, setQuoteSubscriptionId] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");

  // Process form state
  const [processSubscriptionId, setProcessSubscriptionId] = useState("");
  const [processSignature, setProcessSignature] = useState("");

  const handleGetQuote = async () => {
    if (!quoteSubscriptionId) {
      setError("Subscription ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    setQuoteData(null);

    const response = await getPaymentQuote({
      subscriptionId: quoteSubscriptionId,
      amount: quoteAmount || undefined,
    });

    if (response.error) {
      setError(response.error.message);
    } else if (response.data) {
      setQuoteData(response.data);
    }

    setLoading(false);
  };

  const handleProcess = async () => {
    if (!processSubscriptionId || !processSignature) {
      setError("Both subscription ID and signature are required");
      return;
    }

    setLoading(true);
    setError(null);
    setProcessResult(null);

    const response = await processPayment({
      subscriptionId: processSubscriptionId,
      signature: processSignature,
    });

    if (response.error) {
      setError(response.error.message);
    } else if (response.data) {
      setProcessResult(response.data);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Payments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment quote retrieval and manual processing tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get payment quote</CardTitle>
          <CardDescription>
            POST /api/payments/quote — estimate gas and total cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quote-subscription">Subscription ID</Label>
              <Input
                id="quote-subscription"
                placeholder="0x..."
                value={quoteSubscriptionId}
                onChange={(e) => setQuoteSubscriptionId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-amount">Amount (optional)</Label>
              <Input
                id="quote-amount"
                placeholder="e.g., 1000"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}
            {quoteData && (
              <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm">
                <p className="mb-2 font-semibold text-emerald-600">Quote received:</p>
                <p>Amount: {quoteData.amount}</p>
                <p>Gas estimate: {quoteData.gasEstimate}</p>
                <p>Total cost: {quoteData.totalCost}</p>
              </div>
            )}
            <Button onClick={handleGetQuote} disabled={loading}>
              {loading ? <Spinner label="Fetching quote" /> : "Get quote"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Process payment</CardTitle>
          <CardDescription>
            POST /api/payments/process — execute a manual subscription payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="process-subscription">Subscription ID</Label>
              <Input
                id="process-subscription"
                placeholder="0x..."
                value={processSubscriptionId}
                onChange={(e) => setProcessSubscriptionId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="process-signature">Signature</Label>
              <Input
                id="process-signature"
                placeholder="0x..."
                value={processSignature}
                onChange={(e) => setProcessSignature(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}
            {processResult && (
              <div
                className={`rounded-lg border p-4 text-sm ${
                  processResult.success
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                    : "border-rose-500/50 bg-rose-500/10 text-rose-600"
                }`}
              >
                <p className="mb-2 font-semibold">
                  {processResult.success ? "Payment succeeded" : "Payment failed"}
                </p>
                <p className="break-all">Transaction: {processResult.transactionHash}</p>
              </div>
            )}
            <Button onClick={handleProcess} disabled={loading}>
              {loading ? <Spinner label="Processing" /> : "Process payment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
