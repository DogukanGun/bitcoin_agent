'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import Link from 'next/link';
import { 
  Bitcoin, 
  Shield, 
  Zap, 
  Users, 
  ArrowRight, 
  CheckCircle,
  TrendingUp,
  Globe,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Bitcoin,
    title: 'Bitcoin Native',
    description: 'Built specifically for Bitcoin subscriptions on Mezo chain with native BTC support.',
  },
  {
    icon: Shield,
    title: 'Agent Delegation',
    description: 'Authorize AI agents to manage your subscriptions with full cryptographic security.',
  },
  {
    icon: Zap,
    title: 'Auto Payments',
    description: 'Never miss a payment with automated processing and grace period protection.',
  },
  {
    icon: Users,
    title: 'Underwriting Pool',
    description: 'Community-backed coverage for missed payments with NFT-based credit scoring.',
  },
  {
    icon: TrendingUp,
    title: 'Credit Building',
    description: 'Build your DeFi credit score with soulbound NFTs tracking payment history.',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Decentralized platform accessible worldwide without traditional banking.',
  },
];

const benefits = [
  'No traditional banking required',
  'Transparent, on-chain transactions', 
  'Community-driven underwriting',
  'AI-powered automation',
  'NFT-based credit scoring',
  'Open source and auditable',
];

export default function HomePage() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bitcoin-50 to-orange-100 flex items-center justify-center">
        <div className="animate-pulse bitcoin-glow bg-bitcoin-500 rounded-full w-16 h-16"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bitcoin-50 to-orange-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-bitcoin-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bitcoin className="h-8 w-8 text-bitcoin-500 mr-2" />
              <span className="text-xl font-bold text-gray-900">PayGuard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <Link href="/dashboard">
                    <Button className="btn-bitcoin">
                      Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <ConnectKitButton />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Bitcoin Subscriptions
              <span className="block text-bitcoin-500">Reimagined</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The first decentralized subscription platform built on Mezo chain. 
              Automate payments, build credit, and never worry about missed subscriptions again.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isConnected ? (
                <div className="flex gap-4">
                  <Link href="/dashboard">
                    <Button size="lg" className="btn-bitcoin">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/subscribe">
                    <Button size="lg" variant="outline" className="btn-ghost-bitcoin">
                      Browse Plans
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <ConnectKitButton />
                  <p className="text-sm text-gray-500">
                    Connect your wallet to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-20 h-20 bg-bitcoin-500/10 rounded-full"></div>
        </div>
        <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-16 h-16 bg-orange-500/10 rounded-full"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge blockchain technology to revolutionize how subscriptions work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-bitcoin-500 mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-bitcoin-500 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Choose PayGuard?
              </h2>
              <p className="text-bitcoin-100 text-lg mb-8">
                Experience the future of subscription payments with blockchain technology 
                that puts you in control.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-bitcoin-100 mr-3" />
                    <span className="text-bitcoin-100">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">100%</div>
                    <div className="text-bitcoin-100 text-sm">On-Chain</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">0%</div>
                    <div className="text-bitcoin-100 text-sm">Platform Fees</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">24/7</div>
                    <div className="text-bitcoin-100 text-sm">Automated</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">∞</div>
                    <div className="text-bitcoin-100 text-sm">Possibilities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the future of subscription payments on Bitcoin. Deploy your first 
            subscription contract or browse available plans.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/deploy">
              <Button size="lg" className="btn-bitcoin">
                <Lock className="mr-2 h-5 w-5" />
                Deploy Contract
              </Button>
            </Link>
            <Link href="/providers">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                For Providers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <Bitcoin className="h-8 w-8 text-bitcoin-500 mr-2" />
                <span className="text-xl font-bold text-gray-900">PayGuard</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                Decentralized Bitcoin subscription platform built on Mezo chain. 
                Open source, secure, and community-driven.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com" className="text-gray-400 hover:text-bitcoin-500">
                  GitHub
                </a>
                <a href="https://discord.com" className="text-gray-400 hover:text-bitcoin-500">
                  Discord
                </a>
                <a href="https://twitter.com" className="text-gray-400 hover:text-bitcoin-500">
                  Twitter
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-gray-600 hover:text-bitcoin-500">Dashboard</Link></li>
                <li><Link href="/subscribe" className="text-gray-600 hover:text-bitcoin-500">Subscribe</Link></li>
                <li><Link href="/deploy" className="text-gray-600 hover:text-bitcoin-500">Deploy</Link></li>
                <li><Link href="/providers" className="text-gray-600 hover:text-bitcoin-500">Providers</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="/docs" className="text-gray-600 hover:text-bitcoin-500">Documentation</a></li>
                <li><a href="/api" className="text-gray-600 hover:text-bitcoin-500">API</a></li>
                <li><a href="/security" className="text-gray-600 hover:text-bitcoin-500">Security</a></li>
                <li><a href="/support" className="text-gray-600 hover:text-bitcoin-500">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2024 PayGuard. Built with ❤️ for the Bitcoin community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}