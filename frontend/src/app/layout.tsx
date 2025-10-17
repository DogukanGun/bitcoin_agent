import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/providers", label: "Providers" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/plans", label: "Plans" },
  { href: "/payments", label: "Payments" },
  { href: "/analytics", label: "Analytics" },
  { href: "/health", label: "Health" },
  { href: "/webhooks", label: "Webhooks" },
  { href: "/auth/login", label: "Auth" },
];

export const metadata: Metadata = {
  title: "PayGuard Console",
  description:
    "Operational console for managing PayGuard blockchain subscriptions, providers, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  PG
                </span>
                PayGuard Console
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-10">
              {children}
            </div>
          </main>
          <footer className="border-t border-border bg-card/60">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} PayGuard Labs. All rights reserved.</p>
              <p className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Chain-ready smart subscription infrastructure
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
