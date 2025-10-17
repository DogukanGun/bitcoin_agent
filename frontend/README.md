# PayGuard Frontend Console

**Modern Next.js 15 operations console** for managing PayGuard blockchain subscriptions, providers, and analytics on the Mezo chain.

## Architecture

Built per the directives in `PROMPT.md`, following **Dan Abramov** × **Vercel** best practices:

- **Next.js 15 App Router** with Server Components by default
- **TypeScript** throughout with strict typing
- **Tailwind CSS v4** for utility-first styling
- **Shadcn/UI** component primitives
- **Fetch-based API client** with typed responses matching the Fastify backend

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with branded navigation
│   ├── page.tsx             # Landing page with quick links
│   ├── dashboard/           # Operations snapshot
│   ├── providers/           # Provider directory + detail + registration
│   ├── subscriptions/       # Subscription search + detail
│   ├── auth/login/          # Signature-based wallet login
│   ├── health/              # API health checks
│   ├── plans/               # Subscription tier listings
│   ├── payments/            # Quote + processing tools
│   ├── analytics/           # Time-series metrics
│   └── webhooks/            # Webhook registration + management
├── components/
│   ├── ui/                  # Reusable Shadcn/UI primitives
│   └── spinner.tsx          # Loading indicator
└── lib/
    ├── api.ts               # Typed fetch helpers for backend
    ├── types.ts             # Shared TypeScript contracts
    └── utils.ts             # cn() utility for className merging
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Backend running on `http://localhost:3001`

### Installation

```bash
cd frontend
pnpm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the console.

## Features

### 🏠 Landing Page
- Product overview with quick navigation panels
- Smart contract architecture summary
- Operational checklist

### 📊 Dashboard (`/dashboard`)
- Real-time provider snapshot (MongoDB-backed)
- Fastify health metrics
- Next-step guidance

### 🏢 Providers (`/providers`)
- **List**: Browse registered providers with pagination
- **Detail** (`/providers/[id]`): View full provider metadata
- **Register** (`/providers/register`): Onboard new partners (Bearer-gated)

### 📜 Subscriptions (`/subscriptions`)
- **Search**: Query SubscriptionFactory by wallet address
- **Detail** (`/subscriptions/[id]`): Inspect on-chain agreement terms
- Displays status badges (ACTIVE/PAUSED/CANCELLED/DEFAULTED)

### 🔐 Authentication (`/auth/login`)
- **Step 1**: Get nonce message from backend
- **Step 2**: Sign with wallet and paste signature
- **Step 3**: Receive JWT token, stored in localStorage
- Token verification tool

### 🩺 Health (`/health`)
- Basic health check (`/api/health`)
- Detailed status with subsystem checks

### 💳 Payments (`/payments`)
- **Get Quote**: Estimate gas and total cost
- **Process**: Manually trigger subscription payment

### 📈 Analytics (`/analytics`)
- Time-series queries with date range and grouping
- Displays subscriptions, payments, volume per period

### 🔔 Webhooks (`/webhooks`)
- Register new webhook endpoints
- List existing webhooks with event subscriptions

### 📦 Plans (`/plans`)
- View predefined subscription tier offerings

## API Integration

All backend communication goes through `src/lib/api.ts`. Each helper returns:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}
```

Graceful handling of:
- **501 Not Implemented** (backend stubs)
- **Network errors**
- **Invalid responses**

## Component Philosophy

Per `PROMPT.md` (Emil Kowalski UI principles):

- **Subtle animations**: Smooth transitions on hover/focus
- **State-driven**: UI reflects data state (loading → error → success)
- **Performance first**: Server Components for data fetching, Client Components only where interactivity is needed

## Styling

- **Tailwind CSS v4** with `@theme inline` custom properties
- **Dark mode** via `.dark` class in `globals.css`
- **Design tokens**: Primary, muted, accent, destructive colors
- **Consistent spacing**: Gap utilities, rounded corners via `--radius`

## Type Safety

- All API responses typed in `src/lib/types.ts`
- Matches Fastify OpenAPI schemas
- No `any` types—strict TypeScript throughout

## Backend Dependencies

Expects these Fastify routes:

- `/api/health`
- `/api/auth/*`
- `/api/providers/*`
- `/api/subscriptions/*`
- `/api/plans/*`
- `/api/payments/*`
- `/api/analytics/*`
- `/api/webhooks/*`

Many return **501 Not Implemented** stubs—frontend handles gracefully.

## Smart Contract Context

Integrates with:

- **SubscriptionFactory**: Creates new subscription contracts
- **SubscriptionContract**: Manages payment agreements
- **UserAgent**: Handles user signatures and permissions
- **ReservePool**: Covers missed payments
- **PaymentPointNFT**: Tracks payment history

See `../smart_contracts` for Solidity sources.

## Development Guidelines

1. **Server Components first**: Fetch data on the server for faster initial loads
2. **Client Components (`'use client'`)** only for interactivity
3. **Type everything**: No implicit `any`
4. **Handle errors gracefully**: Display backend stubs with clear messaging
5. **Use semantic HTML**: Proper `<label>`, `<button>`, `<nav>` tags
6. **Accessible**: ARIA labels where needed

## Build & Deploy

```bash
# Production build
pnpm build

# Start production server
pnpm start
```

Recommended deployment: **Vercel** (native Next.js support).

## Testing

Currently no test suite. Recommended additions:

- Vitest + React Testing Library for components
- Playwright for E2E flows (auth, provider registration, subscription search)

## Troubleshooting

**"Failed to load providers"**
→ Ensure MongoDB is connected in the backend.

**"Health endpoint unreachable"**
→ Confirm backend is running on port 3001.

**"501 Not Implemented"**
→ Expected for unfinished backend routes. Frontend shows clear messaging.

## License

Proprietary. © 2025 PayGuard Labs.
