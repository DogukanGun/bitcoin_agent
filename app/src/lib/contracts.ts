import { ethers } from 'ethers';

// Contract ABIs
export const SUBSCRIPTION_FACTORY_ABI = [
  'function createUserAgent(address user) external returns (address)',
  'function createSubscription(tuple(bytes32 agreementId, address user, address provider, address token, uint256 amount, uint256 period, uint256 startDate, uint256 gracePeriod, uint256 maxCover, uint256 nonce) agreement, bytes providerSig, bytes userSig) external returns (address)',
  'function getUserSubscriptions(address user) external view returns (address[])',
  'function getSubscription(bytes32 agreementId) external view returns (address)',
  'function getUserAgent(address user) external view returns (address)',
  'event SubscriptionCreated(bytes32 indexed agreementId, address indexed user, address indexed provider, address subscription, address userAgent)',
  'event UserAgentCreated(address indexed user, address indexed userAgent)'
] as const;

export const SUBSCRIPTION_CONTRACT_ABI = [
  'function getSubscriptionInfo() external view returns (tuple(bytes32 agreementId, address user, address userAgent, address provider, address token, uint256 amount, uint256 period, uint256 startDate, uint256 gracePeriod, uint256 maxCover), uint8, uint256, uint256, uint256, uint256)',
  'function pay() external',
  'function cancelByUser(bytes signature, uint256 nonce) external',
  'function pause() external',
  'function resume() external',
  'function isPaymentDue() external view returns (bool)',
  'function isInGracePeriod() external view returns (bool)',
  'function canClaimFromPool() external view returns (bool)',
  'function getPaymentHistory() external view returns (tuple(uint256 dueDate, uint256 paidDate, uint256 amount, bool fromPool, address payer, uint256 nftTokenId)[])',
  'function getDebtStatus() external view returns (uint256 poolDebt, uint256 nextDue, bool overdue)',
  'event PaymentMade(uint256 indexed period, uint256 amount, address payer, bool fromPool, uint256 nftTokenId)',
  'event SubscriptionCancelled(address indexed canceller, uint256 timestamp)',
  'event StatusChanged(uint8 oldStatus, uint8 newStatus)'
] as const;

export const USER_AGENT_ABI = [
  'function isValidSignature(bytes32 hash, bytes signature) external view returns (bytes4)',
  'function isAuthorizedAgent(address agent) external view returns (bool)',
  'function owner() external view returns (address)',
  'function authorizeAgent(address agent, bool authorized) external',
  'function getAgentNonce(address agent) external view returns (uint256)',
  'event AgentAuthorized(address indexed agent, bool authorized)'
] as const;

export const RESERVE_POOL_ABI = [
  'function addStake(address token, uint256 amount, uint256 utilizationCap) external',
  'function removeStake(address token, uint256 amount) external',
  'function grantCreditLine(address user, address token, uint256 amount) external',
  'function getUnderwritingCapacity(address user, address token) external view returns (uint256)',
  'function getPoolStats(address token) external view returns (uint256 totalStaked, uint256 totalUtilized, uint256 utilizationRate, uint256 maxUtilizationRate, uint256 availableCapacity)',
  'function getUserDebt(address user, address token) external view returns (uint256)',
  'event StakeAdded(address indexed underwriter, address indexed token, uint256 amount, uint256 utilizationCap)',
  'event CreditLineGranted(address indexed user, address indexed token, uint256 amount, address indexed underwriter)'
] as const;

export const PAYMENT_POINT_NFT_ABI = [
  'function getUserScore(address user) external view returns (uint256)',
  'function getUserPoints(address user) external view returns (uint256[])',
  'function getUserPaymentHistory(address user) external view returns (tuple(address user, address subscription, uint256 amount, uint256 timestamp, uint256 score, string metadata, bool soulbound)[])',
  'function getCreditScore(address user) external view returns (uint256 score, string rating)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'event PaymentPointMinted(uint256 indexed tokenId, address indexed user, address indexed subscription, uint256 score, bool soulbound)'
] as const;

export const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
] as const;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  SUBSCRIPTION_FACTORY: process.env.NEXT_PUBLIC_SUBSCRIPTION_FACTORY_ADDRESS as `0x${string}`,
  RESERVE_POOL: process.env.NEXT_PUBLIC_RESERVE_POOL_ADDRESS as `0x${string}`,
  PAYMENT_POINT_NFT: process.env.NEXT_PUBLIC_PAYMENT_POINT_NFT_ADDRESS as `0x${string}`,
  TEST_TOKEN: process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS as `0x${string}`,
} as const;

// Contract instances helper
export function getContractConfig(contractName: keyof typeof CONTRACT_ADDRESSES) {
  const address = CONTRACT_ADDRESSES[contractName];
  
  switch (contractName) {
    case 'SUBSCRIPTION_FACTORY':
      return {
        address,
        abi: SUBSCRIPTION_FACTORY_ABI,
      };
    case 'RESERVE_POOL':
      return {
        address,
        abi: RESERVE_POOL_ABI,
      };
    case 'PAYMENT_POINT_NFT':
      return {
        address,
        abi: PAYMENT_POINT_NFT_ABI,
      };
    case 'TEST_TOKEN':
      return {
        address,
        abi: ERC20_ABI,
      };
    default:
      throw new Error(`Unknown contract: ${contractName}`);
  }
}

// EIP-712 types and domains
export const EIP712_DOMAIN = {
  name: 'PayGuard',
  version: '1',
  chainId: parseInt(process.env.NEXT_PUBLIC_MEZO_CHAIN_ID || '686868'),
  verifyingContract: CONTRACT_ADDRESSES.SUBSCRIPTION_FACTORY,
};

export const PAYMENT_AGREEMENT_TYPES = {
  PaymentAgreement: [
    { name: 'agreementId', type: 'bytes32' },
    { name: 'user', type: 'address' },
    { name: 'provider', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'period', type: 'uint256' },
    { name: 'startDate', type: 'uint256' },
    { name: 'gracePeriod', type: 'uint256' },
    { name: 'maxCover', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};

export const CANCEL_SUBSCRIPTION_TYPES = {
  CancelSubscription: [
    { name: 'agreementId', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

// Helper functions
export function generateAgreementId(
  user: string,
  provider: string,
  token: string,
  amount: string,
  startDate: number
): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'address', 'uint256', 'uint256'],
      [user, provider, token, amount, startDate]
    )
  );
}

export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return ethers.formatUnits(amount, decimals);
}

export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals);
}

export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

// Chain configuration for Mezo
export const MEZO_CHAIN = {
  id: parseInt(process.env.NEXT_PUBLIC_MEZO_CHAIN_ID || '686868'),
  name: 'Mezo',
  network: 'mezo',
  nativeCurrency: {
    decimals: 18,
    name: 'Bitcoin',
    symbol: 'BTC',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MEZO_RPC_URL || 'https://rpc.mezo.org'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MEZO_RPC_URL || 'https://rpc.mezo.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.mezo.org' },
  },
  testnet: process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true',
} as const;

// Status mappings
export const SUBSCRIPTION_STATUS = {
  0: 'ACTIVE',
  1: 'PAUSED', 
  2: 'CANCELLED',
  3: 'DEFAULTED',
} as const;

export const SUBSCRIPTION_STATUS_COLORS = {
  ACTIVE: 'text-green-600 bg-green-100',
  PAUSED: 'text-yellow-600 bg-yellow-100',
  CANCELLED: 'text-red-600 bg-red-100',
  DEFAULTED: 'text-red-800 bg-red-200',
} as const;

export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUS_COLORS;