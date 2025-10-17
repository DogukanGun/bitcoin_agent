import { ethers } from 'ethers';
import { PaymentAgreement } from '@/types';
export declare class BlockchainService {
    private provider;
    private platformSigner;
    private initialized;
    constructor();
    private initialize;
    isAvailable(): boolean;
    getProvider(): Promise<ethers.JsonRpcProvider>;
    getPlatformSigner(): Promise<ethers.Wallet>;
    getContract(address: string, abi: any): Promise<ethers.Contract>;
    getSubscriptionFactory(): Promise<ethers.Contract>;
    getSubscriptionContract(address: string): Promise<ethers.Contract>;
    getReservePool(): Promise<ethers.Contract>;
    getPaymentPointNFT(): Promise<ethers.Contract>;
    getERC20Contract(address: string): Promise<ethers.Contract>;
    estimateGas(contract: ethers.Contract, method: string, ...args: any[]): Promise<bigint>;
    getCurrentGasPrice(): Promise<bigint>;
    getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null>;
    waitForTransaction(txHash: string, confirmations?: number): Promise<ethers.TransactionReceipt | null>;
    isValidAddress(address: string): Promise<boolean>;
    getBlockNumber(): Promise<number>;
    getBalance(address: string): Promise<bigint>;
    getDomain(verifyingContract: string): {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: string;
    };
    getPaymentAgreementTypes(): {
        PaymentAgreement: {
            name: string;
            type: string;
        }[];
    };
    getCancelSubscriptionTypes(): {
        CancelSubscription: {
            name: string;
            type: string;
        }[];
    };
    signPaymentAgreement(agreement: PaymentAgreement): Promise<string>;
    verifySignature(domain: any, types: any, data: any, signature: string, expectedSigner: string): boolean;
    generateAgreementId(user: string, provider: string, token: string, amount: string, startDate: number): string;
    getNetworkInfo(): Promise<{
        chainId: string;
        name: string;
        blockNumber: number;
        gasPrice: string;
    }>;
    getSubscriptionEvents(fromBlock?: number, toBlock?: number | 'latest'): Promise<{
        subscriptionCreated: (ethers.Log | ethers.EventLog)[];
        userAgentCreated: (ethers.Log | ethers.EventLog)[];
    }>;
    getPaymentEvents(contractAddress: string, fromBlock?: number): Promise<{
        payments: (ethers.Log | ethers.EventLog)[];
        cancellations: (ethers.Log | ethers.EventLog)[];
        statusChanges: (ethers.Log | ethers.EventLog)[];
    }>;
}
export declare const blockchainService: BlockchainService;
//# sourceMappingURL=blockchain.d.ts.map