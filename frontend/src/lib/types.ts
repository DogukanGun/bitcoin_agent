// src/lib/types.ts
// Shared TypeScript contracts that mirror the backend Fastify/OpenAPI responses.

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

export interface HealthSnapshot {
  status: string;
  timestamp: number;
  uptime: number;
  version?: string;
  checks?: Record<string, boolean>;
}

export interface Provider {
  id: string;
  address: string;
  name: string;
  description: string;
  website: string;
  email?: string;
  verified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProviderListResponse {
  data: Provider[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProviderRegistrationInput {
  address: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
}

export interface SubscriptionAgreement {
  agreementId: string;
  user: string;
  provider: string;
  token: string;
  amount: string;
  period: number;
  startDate: number;
  gracePeriod: number;
  maxCover: string;
  nonce: number;
}

export interface Subscription {
  id: string;
  agreementId: string;
  contractAddress: string;
  userId: string;
  providerAddress: string;
  tokenAddress: string;
  amount: string;
  period: number;
  status: string;
  nextPaymentDue: string | Date;
  currentPeriod?: number;
  totalPaid: string;
  totalFromPool?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SubscriptionListResponse {
  data: Subscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SubscriptionCreationPayload {
  agreement: SubscriptionAgreement;
  providerSignature: string;
  userSignature: string;
}

export interface SubscriptionCreationResponse {
  subscriptionAddress: string;
  agreementId: string;
  transactionHash: string;
}

export interface Plan {
  id: string;
  name: string;
  amount: string;
  period: number;
  active?: boolean;
}

export interface PlanListResponse {
  data: Plan[];
}

export interface PaymentQuoteResponse {
  subscriptionId: string;
  amount: string;
  gasEstimate: string;
  totalCost: string;
}

export interface PaymentProcessResponse {
  transactionHash: string;
  success: boolean;
}

export interface AnalyticsPoint {
  date: string;
  subscriptions: number;
  payments: number;
  volume: string;
}

export interface AnalyticsResponse {
  data: AnalyticsPoint[];
}

export interface ProviderAnalyticsResponse {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
}

export interface WebhookListResponse {
  data: Webhook[];
}

export interface WebhookRegistrationPayload {
  url: string;
  events: string[];
}

export interface NonceResponse {
  message: string;
  address: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    address: string;
    userAgentAddress?: string | null;
    createdAt: string;
  };
}

export interface VerifyTokenResponse {
  valid: boolean;
  user: {
    userId: string;
    address: string;
  } | null;
}

export interface UserProfile {
  address: string;
  userAgentAddress: string | null;
  createdAt: string;
}
