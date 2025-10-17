'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig, createConfig } from 'wagmi';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { MEZO_CHAIN } from '@/lib/contracts';

// Create wagmi config
const config = createConfig(
  getDefaultConfig({
    alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID,
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [MEZO_CHAIN as any],
    appName: 'PayGuard',
    appDescription: 'Bitcoin subscription platform on Mezo chain',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    appIcon: '/logo.png',
  })
);

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="auto"
          mode="auto"
          customTheme={{
            '--ck-connectbutton-font-size': '16px',
            '--ck-connectbutton-border-radius': '8px',
            '--ck-connectbutton-color': '#f7931a',
            '--ck-connectbutton-background': '#ffffff',
            '--ck-connectbutton-box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
            '--ck-primary-button-border-radius': '8px',
            '--ck-primary-button-color': '#ffffff',
            '--ck-primary-button-background': '#f7931a',
            '--ck-primary-button-hover-background': '#e67e22',
          }}
          options={{
            initialChainId: MEZO_CHAIN.id,
            disclaimer: (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">⚠️ Important Notice</p>
                <p>
                  This is experimental software running on Mezo testnet. Never use real funds.
                  By connecting, you acknowledge the risks involved in using experimental DeFi protocols.
                </p>
              </div>
            ),
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}