import Link from "next/link";

const quickLinks = [
  {
    href: "/dashboard",
    title: "Operational Dashboard",
    description: "Monitor providers, subscriptions, and payment health in real time.",
  },
  {
    href: "/providers",
    title: "Providers",
    description: "Review registered providers or onboard a new service partner.",
  },
  {
    href: "/subscriptions",
    title: "Subscriptions",
    description: "Inspect on-chain agreements, generate new ones, or manage cancellations.",
  },
  {
    href: "/auth/login",
    title: "Authentication",
    description: "Test signature-based login flows end-to-end across the stack.",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-border bg-card/60 p-10 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Built for predictable Bitcoin cash flow
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              PayGuard keeps subscription revenue streaming on Mezo chain.
            </h1>
            <p className="text-muted-foreground">
              Coordinate providers, users, and smart contracts from a single operations console. Every
              action mapped here calls directly into the Fastify backend and underlying Solidity
              agreements so you can validate the full lifecycle.
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
              >
                Launch dashboard
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                View API docs
              </Link>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-sm text-muted-foreground">
            <h2 className="text-base font-semibold text-primary">
              Smart contract matrix
            </h2>
            <p className="mt-3">
              The console orchestrates the SubscriptionFactory, UserAgent, and ReservePool contracts in
              the <code className="rounded-md bg-card px-1 py-0.5">smart_contracts</code> package.
              Each workflow below surfaces chain-aligned data or mocks missing pieces when the backend
              returns 501 responses.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-border bg-card/50 p-6 transition hover:border-primary/60 hover:shadow-lg"
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Open
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/60 text-xs">
                →
              </span>
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-card/60 p-8">
        <h2 className="text-xl font-semibold">Operational checklist</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Follow this flow to validate the stack end-to-end:
        </p>
        <ol className="mt-6 space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              1
            </span>
            Generate a wallet message on the Auth page, sign it locally, and confirm the JWT through
            the verification endpoint.
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              2
            </span>
            Register a provider or import one from chain state, then review its metadata in the
            provider detail view.
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              3
            </span>
            Draft a payment agreement and submit it through the subscription creation wizard to push a
            new on-chain contract via the SubscriptionFactory.
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              4
            </span>
            Capture analytics and health status to confirm supporting services are configured and
            responsive.
          </li>
        </ol>
      </section>
    </div>
  );
}
