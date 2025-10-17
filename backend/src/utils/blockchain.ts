import { ethers } from 'ethers';
import { PaymentAgreement } from '@/types';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private platformSigner: ethers.Wallet | null = null;
  private initialized: boolean = false;
  
  constructor() {
    // Don't initialize in constructor - do it lazily
  }

  private initialize(): void {
    if (this.initialized) {
      return;
    }

    const rpcUrl = process.env.MEZO_RPC_URL;
    const signerKey = process.env.PLATFORM_SIGNER_KEY;

    if (!rpcUrl || !signerKey) {
      console.warn('Blockchain configuration missing. Blockchain features will be disabled.');
      this.initialized = true;
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.platformSigner = new ethers.Wallet(signerKey, this.provider);
      this.initialized = true;
      console.log('Blockchain service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      this.initialized = true;
    }
  }

  isAvailable(): boolean {
    this.initialize();
    return this.provider !== null && this.platformSigner !== null;
  }

  async getProvider(): Promise<ethers.JsonRpcProvider> {
    this.initialize();
    if (!this.provider) {
      throw new Error('Blockchain provider not configured. Please set MEZO_RPC_URL in environment variables.');
    }
    return this.provider;
  }

  async getPlatformSigner(): Promise<ethers.Wallet> {
    this.initialize();
    if (!this.platformSigner) {
      throw new Error('Platform signer not configured. Please set PLATFORM_SIGNER_KEY in environment variables.');
    }
    return this.platformSigner;
  }

  async getContract(address: string, abi: any): Promise<ethers.Contract> {
    const signer = await this.getPlatformSigner();
    return new ethers.Contract(address, abi, signer);
  }

  async getSubscriptionFactory(): Promise<ethers.Contract> {
    const abi = [
      'function createUserAgent(address user) external returns (address)',
      'function createSubscription(tuple(bytes32 agreementId, address user, address provider, address token, uint256 amount, uint256 period, uint256 startDate, uint256 gracePeriod, uint256 maxCover, uint256 nonce) agreement, bytes providerSig, bytes userSig) external returns (address)',
      'function getUserSubscriptions(address user) external view returns (address[])',
      'function getSubscription(bytes32 agreementId) external view returns (address)',
      'function getUserAgent(address user) external view returns (address)',
      'event SubscriptionCreated(bytes32 indexed agreementId, address indexed user, address indexed provider, address subscription, address userAgent)',
      'event UserAgentCreated(address indexed user, address indexed userAgent)'
    ];
    
    return this.getContract(process.env.SUBSCRIPTION_FACTORY_ADDRESS!, abi);
  }

  async getSubscriptionContract(address: string): Promise<ethers.Contract> {
    const abi = [
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
    ];
    
    return this.getContract(address, abi);
  }

  async getReservePool(): Promise<ethers.Contract> {
    const abi = [
      'function addStake(address token, uint256 amount, uint256 utilizationCap) external',
      'function removeStake(address token, uint256 amount) external',
      'function grantCreditLine(address user, address token, uint256 amount) external',
      'function getUnderwritingCapacity(address user, address token) external view returns (uint256)',
      'function getPoolStats(address token) external view returns (uint256 totalStaked, uint256 totalUtilized, uint256 utilizationRate, uint256 maxUtilizationRate, uint256 availableCapacity)',
      'function getUserDebt(address user, address token) external view returns (uint256)',
      'event StakeAdded(address indexed underwriter, address indexed token, uint256 amount, uint256 utilizationCap)',
      'event CreditLineGranted(address indexed user, address indexed token, uint256 amount, address indexed underwriter)'
    ];
    
    return this.getContract(process.env.RESERVE_POOL_ADDRESS!, abi);
  }

  async getPaymentPointNFT(): Promise<ethers.Contract> {
    const abi = [
      'function getUserScore(address user) external view returns (uint256)',
      'function getUserPoints(address user) external view returns (uint256[])',
      'function getUserPaymentHistory(address user) external view returns (tuple(address user, address subscription, uint256 amount, uint256 timestamp, uint256 score, string metadata, bool soulbound)[])',
      'function getCreditScore(address user) external view returns (uint256 score, string rating)',
      'function balanceOf(address owner) external view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
      'event PaymentPointMinted(uint256 indexed tokenId, address indexed user, address indexed subscription, uint256 score, bool soulbound)'
    ];
    
    return this.getContract(process.env.PAYMENT_POINT_NFT_ADDRESS!, abi);
  }

  async getERC20Contract(address: string): Promise<ethers.Contract> {
    const abi = [
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
    ];
    
    return this.getContract(address, abi);
  }

  async estimateGas(contract: ethers.Contract, method: string, ...args: any[]): Promise<bigint> {
    return await contract[method].estimateGas(...args);
  }

  async getCurrentGasPrice(): Promise<bigint> {
    const provider = await this.getProvider();
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || ethers.parseUnits('20', 'gwei');
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    const provider = await this.getProvider();
    return await provider.getTransactionReceipt(txHash);
  }

  async waitForTransaction(txHash: string, confirmations = 1): Promise<ethers.TransactionReceipt | null> {
    const provider = await this.getProvider();
    return await provider.waitForTransaction(txHash, confirmations);
  }

  async isValidAddress(address: string): Promise<boolean> {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  async getBlockNumber(): Promise<number> {
    const provider = await this.getProvider();
    return await provider.getBlockNumber();
  }

  async getBalance(address: string): Promise<bigint> {
    const provider = await this.getProvider();
    return await provider.getBalance(address);
  }

  // EIP-712 Helpers
  getDomain(verifyingContract: string) {
    return {
      name: 'PayGuard',
      version: '1',
      chainId: parseInt(process.env.CHAIN_ID || '686868'),
      verifyingContract,
    };
  }

  getPaymentAgreementTypes() {
    return {
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
  }

  getCancelSubscriptionTypes() {
    return {
      CancelSubscription: [
        { name: 'agreementId', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
        { name: 'timestamp', type: 'uint256' },
      ],
    };
  }

  async signPaymentAgreement(agreement: PaymentAgreement): Promise<string> {
    const signer = await this.getPlatformSigner();
    const domain = this.getDomain(process.env.SUBSCRIPTION_FACTORY_ADDRESS!);
    const types = this.getPaymentAgreementTypes();
    
    return await signer.signTypedData(domain, types, agreement);
  }

  verifySignature(
    domain: any,
    types: any,
    data: any,
    signature: string,
    expectedSigner: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyTypedData(domain, types, data, signature);
      return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
    } catch {
      return false;
    }
  }

  generateAgreementId(
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

  async getNetworkInfo() {
    const provider = await this.getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await this.getBlockNumber();
    const gasPrice = await this.getCurrentGasPrice();
    
    return {
      chainId: network.chainId.toString(),
      name: network.name,
      blockNumber,
      gasPrice: gasPrice.toString(),
    };
  }

  // Event filtering helpers
  async getSubscriptionEvents(
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest'
  ) {
    const factory = await this.getSubscriptionFactory();
    
    const subscriptionCreatedFilter = factory.filters.SubscriptionCreated();
    const userAgentCreatedFilter = factory.filters.UserAgentCreated();
    
    const [subscriptionEvents, userAgentEvents] = await Promise.all([
      factory.queryFilter(subscriptionCreatedFilter, fromBlock, toBlock),
      factory.queryFilter(userAgentCreatedFilter, fromBlock, toBlock),
    ]);
    
    return {
      subscriptionCreated: subscriptionEvents,
      userAgentCreated: userAgentEvents,
    };
  }

  async getPaymentEvents(contractAddress: string, fromBlock: number = 0) {
    const subscription = await this.getSubscriptionContract(contractAddress);
    
    const paymentFilter = subscription.filters.PaymentMade();
    const cancelFilter = subscription.filters.SubscriptionCancelled();
    const statusFilter = subscription.filters.StatusChanged();
    
    const [paymentEvents, cancelEvents, statusEvents] = await Promise.all([
      subscription.queryFilter(paymentFilter, fromBlock),
      subscription.queryFilter(cancelFilter, fromBlock),
      subscription.queryFilter(statusFilter, fromBlock),
    ]);
    
    return {
      payments: paymentEvents,
      cancellations: cancelEvents,
      statusChanges: statusEvents,
    };
  }
}

export const blockchainService = new BlockchainService();