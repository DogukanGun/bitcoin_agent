// src/lib/api.ts
// Typed fetch helpers for communicating with the Fastify backend.

import type {
  AnalyticsResponse,
  ApiError,
  ApiResponse,
  HealthSnapshot,
  LoginResponse,
  NonceResponse,
  PaymentProcessResponse,
  PaymentQuoteResponse,
  Plan,
  PlanListResponse,
  Provider,
  ProviderAnalyticsResponse,
  ProviderListResponse,
  ProviderRegistrationInput,
  Subscription,
  SubscriptionCreationPayload,
  SubscriptionCreationResponse,
  SubscriptionListResponse,
  UserProfile,
  VerifyTokenResponse,
  Webhook,
  WebhookListResponse,
  WebhookRegistrationPayload,
} from "./types";

const DEFAULT_BASE_URL = "http://localhost:3001/api";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

type ApiInit = RequestInit & {
  skipDefaultHeaders?: boolean;
};

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

const toApiError = (status: number, payload: unknown): ApiError => {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorPayload = (payload as { error: ApiError }).error;
    return {
      code: errorPayload?.code || `HTTP_${status}`,
      message: errorPayload?.message || "Request failed",
      details: errorPayload?.details,
    };
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    return {
      code: `HTTP_${status}`,
      message: String((payload as { message: unknown }).message),
    };
  }

  return {
    code: `HTTP_${status}`,
    message: "Unexpected response from server",
    details: payload,
  };
};

export async function apiFetch<T>(path: string, init?: ApiInit): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  const headers = init?.skipDefaultHeaders
    ? init.headers
    : {
        ...defaultHeaders,
        ...(init?.headers || {}),
      };

  try {
    const response = await fetch(url, {
      cache: "no-store",
      ...init,
      headers,
    });

    if (response.status === 204) {
      return {
        data: null,
        error: null,
        status: response.status,
      };
    }

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      return {
        data: null,
        error: toApiError(response.status, payload),
        status: response.status,
      };
    }

    return {
      data: payload as T,
      error: null,
      status: response.status,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network request failed",
        details: error,
      },
      status: 0,
    };
  }
}

// Health ---------------------------------------------------------------------
export const getHealthSummary = () => apiFetch<HealthSnapshot>("/health");

export const getHealthDetailed = () => apiFetch<HealthSnapshot>("/health/detailed");

// Providers ------------------------------------------------------------------
export const listProviders = (params: {
  page?: number;
  limit?: number;
  verified?: boolean;
} = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (typeof params.verified === "boolean") {
    searchParams.set("verified", String(params.verified));
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiFetch<ProviderListResponse>(`/providers${suffix}`);
};

export const getProviderById = (providerId: string) => apiFetch<Provider>(`/providers/${providerId}`);

export const registerProvider = (
  payload: ProviderRegistrationInput,
  token?: string,
) =>
  apiFetch<Provider>("/providers/register", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

// Subscriptions --------------------------------------------------------------
export const listSubscriptions = (params: {
  userAddress: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const searchParams = new URLSearchParams({
    userAddress: params.userAddress,
  });

  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  return apiFetch<SubscriptionListResponse>(`/subscriptions?${searchParams.toString()}`);
};

export const getSubscriptionById = (subscriptionId: string) =>
  apiFetch<Subscription>(`/subscriptions/${subscriptionId}`);

export const createSubscription = (payload: SubscriptionCreationPayload) =>
  apiFetch<SubscriptionCreationResponse>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const cancelSubscription = (
  subscriptionId: string,
  payload: { signature: string; nonce: number },
) =>
  apiFetch<{ transactionHash: string; cancelled: boolean }>(
    `/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

// Plans ----------------------------------------------------------------------
export const listPlans = () => apiFetch<PlanListResponse>("/plans");

export const getPlanById = (planId: string) => apiFetch<Plan>(`/plans/${planId}`);

// Payments -------------------------------------------------------------------
export const getPaymentQuote = (payload: { subscriptionId: string; amount?: string }) =>
  apiFetch<PaymentQuoteResponse>("/payments/quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const processPayment = (payload: { subscriptionId: string; signature: string }) =>
  apiFetch<PaymentProcessResponse>("/payments/process", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Analytics ------------------------------------------------------------------
export const getAnalytics = (params: { startDate?: string; endDate?: string; groupBy?: string }) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiFetch<AnalyticsResponse>(`/analytics${suffix}`);
};

export const getProviderAnalytics = (providerId: string) =>
  apiFetch<ProviderAnalyticsResponse>(`/analytics/provider/${providerId}`);

// Webhooks -------------------------------------------------------------------
export const listWebhooks = () => apiFetch<WebhookListResponse>("/webhooks");

export const registerWebhook = (payload: WebhookRegistrationPayload) =>
  apiFetch<Webhook>("/webhooks/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Authentication -------------------------------------------------------------
export const getNonceForAddress = (address: string) =>
  apiFetch<NonceResponse>(`/auth/nonce/${address}`);

export const loginWithSignature = (payload: {
  address: string;
  message: string;
  signature: string;
}) =>
  apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const verifyToken = (token: string) =>
  apiFetch<VerifyTokenResponse>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

export const getCurrentUser = (token: string) =>
  apiFetch<{ id: string; address: string; userAgentAddress: string | null; createdAt: string }>(
    "/auth/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

// Users ----------------------------------------------------------------------
export const getUserProfile = (address: string) => apiFetch<UserProfile>(`/users/${address}`);

export const upsertUser = (payload: { address: string }) =>
  apiFetch<UserProfile>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Utility --------------------------------------------------------------------
export const toStatusColor = (status: string | undefined) => {
  if (!status) return "text-muted-foreground";
  switch (status.toUpperCase()) {
    case "HEALTHY":
    case "ACTIVE":
      return "text-emerald-500";
    case "PAUSED":
      return "text-amber-500";
    case "CANCELLED":
    case "INVALID":
      return "text-rose-500";
    default:
      return "text-muted-foreground";
  }
};
