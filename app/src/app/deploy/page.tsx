'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Shield, 
  ArrowRight, 
  Copy, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bitcoin,
  Users,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CONTRACT_ADDRESSES, getContractConfig } from '@/lib/contracts';

const DEPLOYMENT_STEPS = [
  {
    id: 1,
    title: 'Deploy User Agent',
    description: 'Create your personal smart contract for subscription management',
    icon: Shield,
    status: 'pending' as const,
  },
  {
    id: 2,
    title: 'Mint Credit NFT',
    description: 'Receive your first payment point NFT to start building credit',
    icon: Bitcoin,
    status: 'pending' as const,
  },
  {
    id: 3,
    title: 'Setup Complete',
    description: 'Your account is ready for subscriptions and payments',
    icon: CheckCircle,
    status: 'pending' as const,
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Agent Delegation',
    description: 'Authorize trusted agents to manage payments on your behalf',
    benefits: ['Automated payments', 'Grace period protection', 'Revocable permissions'],
  },
  {
    icon: Bitcoin,
    title: 'Credit Building',
    description: 'Build your DeFi credit score with on-time payments',
    benefits: ['Soulbound NFTs', 'Credit history tracking', 'Better underwriting terms'],
  },
  {
    icon: Users,
    title: 'Pool Protection',
    description: 'Community underwriting covers missed payments',
    benefits: ['Automatic coverage', 'Low fees', 'Community-driven'],
  },
];

export default function DeployPage() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [userAgentAddress, setUserAgentAddress] = useState<string>('');
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [steps, setSteps] = useState(DEPLOYMENT_STEPS);

  const updateStepStatus = (stepId: number, status: 'pending' | 'loading' | 'completed' | 'error') => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const handleDeploy = async () => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsDeploying(true);
    setDeploymentStep(1);

    try {
      // Step 1: Deploy User Agent
      updateStepStatus(1, 'loading');
      
      const factoryConfig = getContractConfig('SUBSCRIPTION_FACTORY');
      
      // Call createUserAgent
      const createUserAgentTx = await walletClient.writeContract({
        address: factoryConfig.address,
        abi: factoryConfig.abi,
        functionName: 'createUserAgent',
        args: [address],
      });

      // Wait for transaction
      const receipt = await walletClient.waitForTransactionReceipt({ 
        hash: createUserAgentTx 
      });

      // Get user agent address from events
      // In a real implementation, you'd parse the events to get the actual address
      const mockUserAgentAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
      setUserAgentAddress(mockUserAgentAddress);
      
      updateStepStatus(1, 'completed');
      setDeploymentStep(2);

      // Step 2: Mint initial NFT
      updateStepStatus(2, 'loading');
      
      // Simulate NFT minting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateStepStatus(2, 'completed');
      setDeploymentStep(3);

      // Step 3: Complete setup
      updateStepStatus(3, 'loading');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStepStatus(3, 'completed');
      setDeploymentComplete(true);

      toast.success('Deployment completed successfully!');
      
    } catch (error) {
      console.error('Deployment failed:', error);
      updateStepStatus(deploymentStep, 'error');
      toast.error('Deployment failed. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bitcoin-50 to-orange-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Shield className="h-16 w-16 text-bitcoin-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Deploy Your User Agent
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect your wallet to deploy your personal subscription management contract
            </p>
            <ConnectKitButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bitcoin-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Deploy Your User Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create your personal smart contract to manage Bitcoin subscriptions with 
            agent delegation and automatic payments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features Overview */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What You'll Get</h2>
            <div className="space-y-6">
              {FEATURES.map((feature, index) => (
                <Card key={index} className="card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <feature.icon className="h-6 w-6 text-bitcoin-500 mr-3" />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3">
                      {feature.description}
                    </CardDescription>
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Deployment Interface */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-6 w-6 text-bitcoin-500 mr-2" />
                  Deployment Setup
                </CardTitle>
                <CardDescription>
                  Deploy your User Agent contract to start using PayGuard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">Connected Account</div>
                      <div className="text-sm text-muted-foreground">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyAddress(address!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">Network</div>
                      <div className="text-sm text-muted-foreground">Mezo Chain</div>
                    </div>
                    <Badge variant="secondary">Connected</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">Estimated Gas Cost</div>
                      <div className="text-sm text-muted-foreground">~0.001 BTC</div>
                    </div>
                    <Badge variant="outline">Estimated</Badge>
                  </div>

                  {!deploymentComplete && (
                    <Button 
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="w-full btn-bitcoin"
                      size="lg"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          Deploy User Agent
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Deployment Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Deployment Progress</CardTitle>
                <CardDescription>
                  Follow the deployment steps below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {step.status === 'loading' ? (
                          <Loader2 className="h-6 w-6 text-bitcoin-500 animate-spin" />
                        ) : step.status === 'completed' ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : step.status === 'error' ? (
                          <AlertCircle className="h-6 w-6 text-red-500" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300 bg-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        {step.status === 'loading' && (
                          <p className="text-sm text-bitcoin-500 mt-1">Processing...</p>
                        )}
                        {step.status === 'error' && (
                          <p className="text-sm text-red-500 mt-1">Failed - please try again</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Success State */}
                {deploymentComplete && (
                  <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                      <h3 className="font-medium text-green-900">Deployment Successful!</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-green-900">User Agent Address:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm bg-green-100 px-2 py-1 rounded text-green-800 font-mono">
                            {userAgentAddress}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyAddress(userAgentAddress)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://explorer.mezo.org/address/${userAgentAddress}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <Button 
                        onClick={() => router.push('/dashboard')}
                        className="btn-bitcoin"
                      >
                        Go to Dashboard
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/subscribe')}
                      >
                        Browse Subscriptions
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <Zap className="h-8 w-8 text-bitcoin-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">One-Time Setup</h3>
                  <p className="text-sm text-gray-600">Deploy once, use for all subscriptions</p>
                </div>
                <div>
                  <Shield className="h-8 w-8 text-bitcoin-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Fully Secure</h3>
                  <p className="text-sm text-gray-600">You maintain full control and ownership</p>
                </div>
                <div>
                  <Bitcoin className="h-8 w-8 text-bitcoin-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Bitcoin Native</h3>
                  <p className="text-sm text-gray-600">Built specifically for Bitcoin payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}