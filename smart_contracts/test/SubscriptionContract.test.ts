import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {
  SubscriptionContract,
  SubscriptionFactory,
  UserAgent,
  ReservePool,
  PaymentPointNFT,
  MockERC20
} from "../typechain-types";

describe("SubscriptionContract", function () {
  let subscriptionContract: SubscriptionContract;
  let factory: SubscriptionFactory;
  let userAgent: UserAgent;
  let reservePool: ReservePool;
  let paymentPointNFT: PaymentPointNFT;
  let mockToken: MockERC20;
  
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let provider: SignerWithAddress;
  let agent: SignerWithAddress;
  let platformSigner: SignerWithAddress;

  let terms: any;
  let startTime: number;

  const DOMAIN = {
    name: "PayGuard",
    version: "1",
    chainId: 1337,
    verifyingContract: "", // Will be set in beforeEach
  };

  const AGREEMENT_TYPES = {
    PaymentAgreement: [
      { name: "agreementId", type: "bytes32" },
      { name: "user", type: "address" },
      { name: "provider", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "period", type: "uint256" },
      { name: "startDate", type: "uint256" },
      { name: "gracePeriod", type: "uint256" },
      { name: "maxCover", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const CANCEL_TYPES = {
    CancelSubscription: [
      { name: "agreementId", type: "bytes32" },
      { name: "nonce", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
  };

  beforeEach(async function () {
    [owner, user, provider, agent, platformSigner] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy(
      "Test Bitcoin Token",
      "tBTC",
      ethers.parseEther("1000000"),
      18
    );

    // Deploy PaymentPointNFT
    const PaymentPointNFT = await ethers.getContractFactory("PaymentPointNFT");
    paymentPointNFT = await PaymentPointNFT.deploy();

    // Deploy ReservePool
    const ReservePool = await ethers.getContractFactory("ReservePool");
    reservePool = await ReservePool.deploy(owner.address);

    // Deploy factory
    const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
    factory = await SubscriptionFactory.deploy(
      platformSigner.address,
      await reservePool.getAddress()
    );

    // Set factory in reserve pool
    await reservePool.setSubscriptionFactory(await factory.getAddress());

    // Set factory in payment point NFT
    await paymentPointNFT.setSubscriptionFactory(await factory.getAddress());

    // Set payment point NFT in factory
    await factory.updatePaymentPointNFT(await paymentPointNFT.getAddress());

    // Create user agent through factory
    const tx = await factory.createUserAgent(user.address);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return factory.interface.parseLog(log).name === 'UserAgentCreated';
      } catch { return false; }
    });
    const userAgentAddress = factory.interface.parseLog(event).args.userAgent;
    userAgent = await ethers.getContractAt("UserAgent", userAgentAddress);

    // Authorize agent
    await userAgent.connect(user).authorizeAgent(agent.address, true);

    // Update domain for signing
    DOMAIN.verifyingContract = await factory.getAddress();

    // Set up subscription terms
    startTime = (await time.latest()) + 3600; // 1 hour from now
    terms = {
      agreementId: ethers.keccak256(ethers.toUtf8Bytes("test-agreement")),
      user: user.address,
      userAgent: await userAgent.getAddress(),
      provider: provider.address,
      token: await mockToken.getAddress(),
      amount: ethers.parseEther("10"),
      period: 2592000, // 30 days
      startDate: startTime,
      gracePeriod: 86400, // 1 day
      maxCover: ethers.parseEther("50"),
    };

    // Create actual subscription through factory for testing
    const agreementData = {
      agreementId: ethers.keccak256(ethers.toUtf8Bytes("test-agreement")),
      user: user.address,
      provider: provider.address,
      token: await mockToken.getAddress(),
      amount: ethers.parseEther("10"),
      period: 2592000, // 30 days
      startDate: startTime,
      gracePeriod: 86400, // 1 day
      maxCover: ethers.parseEther("50"),
      nonce: 1,
    };

    // Sign agreement to create subscription
    const providerSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);
    const userSignature = await user.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);

    // Create subscription through factory
    const subTx = await factory.createSubscription(agreementData, providerSignature, userSignature);
    const subReceipt = await subTx.wait();
    
    // Get subscription contract address from event
    const subEvent = subReceipt.logs.find(log => {
      try {
        return factory.interface.parseLog(log).name === 'SubscriptionCreated';
      } catch { return false; }
    });
    const subscriptionAddress = factory.interface.parseLog(subEvent).args.subscription;
    subscriptionContract = await ethers.getContractAt("SubscriptionContract", subscriptionAddress);

    // Authorize subscription contract to mint NFTs
    await paymentPointNFT.authorizeMinter(subscriptionAddress, true);

    // Mint tokens to user and approve subscription contract
    await mockToken.mint(user.address, ethers.parseEther("100"));
    await mockToken.connect(user).approve(await subscriptionContract.getAddress(), ethers.parseEther("100"));
  });

  describe("Initialization", function () {
    it("Should initialize with correct terms", async function () {
      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      const contractTerms = contractInfo[0];
      
      expect(contractTerms.agreementId).to.equal(terms.agreementId);
      expect(contractTerms.user).to.equal(terms.user);
      expect(contractTerms.provider).to.equal(terms.provider);
      expect(contractTerms.amount).to.equal(terms.amount);
      expect(contractTerms.period).to.equal(terms.period);
    });

    it("Should start with ACTIVE status", async function () {
      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[1]).to.equal(0); // ACTIVE status
    });

    it("Should set correct next payment due date", async function () {
      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[2]).to.equal(terms.startDate); // nextPaymentDue
    });

    it("Should reject invalid initialization parameters", async function () {
      // Test validation through factory since direct initialization is disabled
      // Testing invalid user address
      const invalidUserData = {
        agreementId: ethers.keccak256(ethers.toUtf8Bytes("invalid-user")),
        user: ethers.ZeroAddress,
        provider: provider.address,
        token: await mockToken.getAddress(),
        amount: ethers.parseEther("10"),
        period: 2592000,
        startDate: (await time.latest()) + 3600,
        gracePeriod: 86400,
        maxCover: ethers.parseEther("50"),
        nonce: 3,
      };

      const providerSig = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, invalidUserData);
      const ownerSig = await owner.signTypedData(DOMAIN, AGREEMENT_TYPES, invalidUserData);

      await expect(
        factory.createSubscription(invalidUserData, providerSig, ownerSig)
      ).to.be.revertedWith("Invalid user address");
    });
  });

  describe("Payment Functionality", function () {
    beforeEach(async function () {
      // Move time to payment due date
      await time.increaseTo(startTime);
    });

    it("Should allow payment when due", async function () {
      const initialProviderBalance = await mockToken.balanceOf(provider.address);
      const initialUserBalance = await mockToken.balanceOf(user.address);
      
      await subscriptionContract.connect(user).pay();
      
      const finalProviderBalance = await mockToken.balanceOf(provider.address);
      const finalUserBalance = await mockToken.balanceOf(user.address);
      
      expect(finalProviderBalance - initialProviderBalance).to.equal(terms.amount);
      expect(initialUserBalance - finalUserBalance).to.equal(terms.amount);

      // Check payment record
      const paymentInfo = await subscriptionContract.getPaymentInfo(1);
      expect(paymentInfo.amount).to.equal(terms.amount);
      expect(paymentInfo.fromPool).to.be.false;
      expect(paymentInfo.payer).to.equal(user.address);
      expect(paymentInfo.nftTokenId).to.be.greaterThan(0);
    });

    it("Should mint NFT on successful payment", async function () {
      const initialNFTBalance = await paymentPointNFT.balanceOf(user.address);
      
      await subscriptionContract.connect(user).pay();
      
      const finalNFTBalance = await paymentPointNFT.balanceOf(user.address);
      expect(finalNFTBalance - initialNFTBalance).to.equal(1);

      // Check user score increased
      const userScore = await paymentPointNFT.getUserScore(user.address);
      expect(userScore).to.be.greaterThan(0);
    });

    it("Should not allow payment before due date", async function () {
      // This test needs to run before the time is set to startTime
      // So we need to skip it or test it differently since beforeEach already sets time to startTime
      
      // Let's create a new subscription with a future start time  
      const futureTime = (await time.latest()) + 172800; // 2 days from now (beyond grace period)
      const futureAgreementData = {
        agreementId: ethers.keccak256(ethers.toUtf8Bytes("future-agreement")),
        user: user.address,
        provider: provider.address,
        token: await mockToken.getAddress(),
        amount: ethers.parseEther("10"),
        period: 2592000, // 30 days
        startDate: futureTime,
        gracePeriod: 86400, // 1 day
        maxCover: ethers.parseEther("50"),
        nonce: 2,
      };

      const providerSig = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, futureAgreementData);
      const userSig = await user.signTypedData(DOMAIN, AGREEMENT_TYPES, futureAgreementData);
      
      const tx = await factory.createSubscription(futureAgreementData, providerSig, userSig);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === 'SubscriptionCreated';
        } catch { return false; }
      });
      const futureSubAddress = factory.interface.parseLog(event).args.subscription;
      const futureSubscription = await ethers.getContractAt("SubscriptionContract", futureSubAddress);
      
      // Authorize and approve the new subscription
      await paymentPointNFT.authorizeMinter(futureSubAddress, true);
      await mockToken.connect(user).approve(futureSubAddress, ethers.parseEther("100"));

      await expect(
        futureSubscription.connect(user).pay()
      ).to.be.revertedWith("Payment not due yet");
    });

    it("Should allow payment during grace period", async function () {
      // Move to grace period
      await time.increaseTo(startTime + terms.gracePeriod - 1);

      await subscriptionContract.connect(user).pay();
      
      const paymentInfo = await subscriptionContract.getPaymentInfo(1);
      expect(paymentInfo.amount).to.equal(terms.amount);
    });

    it("Should not allow duplicate payments for same period", async function () {
      // Make first payment
      await subscriptionContract.connect(user).pay();
      
      // Try to pay again immediately - should fail because we're now in next period
      // and next payment isn't due yet
      await expect(
        subscriptionContract.connect(user).pay()
      ).to.be.revertedWith("Payment not due yet");
    });

    it("Should update payment tracking correctly", async function () {
      await subscriptionContract.connect(user).pay();
      
      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[3]).to.equal(2); // currentPeriod incremented
      expect(contractInfo[4]).to.equal(terms.amount); // totalPaid
      expect(contractInfo[2]).to.equal(BigInt(startTime) + BigInt(terms.period)); // nextPaymentDue
    });

    it("Should handle multiple payment periods", async function () {
      // First payment
      await subscriptionContract.connect(user).pay();
      
      // Move to next period
      await time.increaseTo(startTime + terms.period);
      
      // Second payment
      await subscriptionContract.connect(user).pay();
      
      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[3]).to.equal(3); // currentPeriod
      expect(contractInfo[4]).to.equal(terms.amount * 2n); // totalPaid
      
      // Check both payment records exist
      const payment1 = await subscriptionContract.getPaymentInfo(1);
      const payment2 = await subscriptionContract.getPaymentInfo(2);
      
      expect(payment1.amount).to.equal(terms.amount);
      expect(payment2.amount).to.equal(terms.amount);
    });
  });

  describe("Cancellation", function () {
    it("Should allow user to cancel subscription with valid signature", async function () {
      const currentTime = await time.latest();
      const cancelData = {
        agreementId: terms.agreementId,
        nonce: 1,
        timestamp: currentTime,
      };

      // Use subscription contract's domain for cancellation
      const cancelDomain = {
        name: "PayGuard",
        version: "1", 
        chainId: 1337,
        verifyingContract: await subscriptionContract.getAddress(),
      };

      const signature = await user.signTypedData(cancelDomain, CANCEL_TYPES, cancelData);

      await expect(subscriptionContract.connect(user).cancelByUser(signature, 1, currentTime))
        .to.emit(subscriptionContract, "SubscriptionCancelled");

      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[1]).to.equal(2); // CANCELLED status
    });

    it("Should allow authorized agent to cancel subscription", async function () {
      const currentTime = await time.latest();
      const cancelData = {
        agreementId: terms.agreementId,
        nonce: 1,
        timestamp: currentTime,
      };

      // Use subscription contract's domain for cancellation
      const cancelDomain = {
        name: "PayGuard",
        version: "1", 
        chainId: 1337,
        verifyingContract: await subscriptionContract.getAddress(),
      };

      const signature = await agent.signTypedData(cancelDomain, CANCEL_TYPES, cancelData);

      await subscriptionContract.connect(agent).cancelByUser(signature, 1, currentTime);

      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[1]).to.equal(2); // CANCELLED status
    });

    it("Should reject cancellation with invalid signature", async function () {
      const currentTime = await time.latest();
      const cancelData = {
        agreementId: terms.agreementId,
        nonce: 1,
        timestamp: currentTime,
      };

      // Sign with provider instead of user/agent
      const signature = await provider.signTypedData(DOMAIN, CANCEL_TYPES, cancelData);

      await expect(
        subscriptionContract.connect(user).cancelByUser(signature, 1, currentTime)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should allow provider emergency cancel", async function () {
      await expect(subscriptionContract.connect(provider).emergencyCancel())
        .to.emit(subscriptionContract, "SubscriptionCancelled");

      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[1]).to.equal(2); // CANCELLED status
    });

    it("Should not allow non-provider emergency cancel", async function () {
      await expect(
        subscriptionContract.connect(user).emergencyCancel()
      ).to.be.revertedWith("Only provider");
    });
  });

  describe("Pause/Resume Functionality", function () {
    it("Should allow user to pause subscription", async function () {
      await expect(subscriptionContract.connect(user).pause())
        .to.emit(subscriptionContract, "StatusChanged")
        .withArgs(0, 1); // ACTIVE to PAUSED
      
      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[1]).to.equal(1); // PAUSED status
    });

    it("Should allow authorized agent to pause subscription", async function () {
      await subscriptionContract.connect(agent).pause();
      
      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[1]).to.equal(1); // PAUSED status
    });

    it("Should allow resuming paused subscription", async function () {
      await subscriptionContract.connect(user).pause();
      
      await expect(subscriptionContract.connect(user).resume())
        .to.emit(subscriptionContract, "StatusChanged")
        .withArgs(1, 0); // PAUSED to ACTIVE
      
      const contractInfo = await subscriptionContract.getSubscriptionInfo();
      expect(contractInfo[1]).to.equal(0); // ACTIVE status
    });

    it("Should not allow non-authorized users to pause", async function () {
      await expect(
        subscriptionContract.connect(provider).pause()
      ).to.be.revertedWith("Unauthorized");
    });

    it("Should not allow resume from non-paused state", async function () {
      await expect(
        subscriptionContract.connect(user).resume()
      ).to.be.revertedWith("Invalid status");
    });

    it("Should not allow pause from cancelled state", async function () {
      // Cancel first
      const currentTime = await time.latest();
      const cancelData = {
        agreementId: terms.agreementId,
        nonce: 1,
        timestamp: currentTime,
      };
      
      // Use subscription contract's domain for cancellation
      const cancelDomain = {
        name: "PayGuard",
        version: "1", 
        chainId: 1337,
        verifyingContract: await subscriptionContract.getAddress(),
      };
      const signature = await user.signTypedData(cancelDomain, CANCEL_TYPES, cancelData);
      await subscriptionContract.connect(user).cancelByUser(signature, 1, currentTime);

      // Try to pause
      await expect(
        subscriptionContract.connect(user).pause()
      ).to.be.revertedWith("Subscription cancelled");
    });
  });

  describe("Status Checks", function () {
    it("Should correctly report payment due status", async function () {
      // Before due date
      expect(await subscriptionContract.isPaymentDue()).to.be.false;
      
      // At due date
      await time.increaseTo(startTime);
      expect(await subscriptionContract.isPaymentDue()).to.be.true;

      // After payment
      await subscriptionContract.connect(user).pay();
      expect(await subscriptionContract.isPaymentDue()).to.be.false;
    });

    it("Should correctly report grace period status", async function () {
      // Move to just after due date
      await time.increaseTo(startTime + 1);
      expect(await subscriptionContract.isInGracePeriod()).to.be.true;
      
      // Move past grace period
      await time.increaseTo(startTime + terms.gracePeriod + 1);
      expect(await subscriptionContract.isInGracePeriod()).to.be.false;
    });

    it("Should correctly report pool claim eligibility", async function () {
      // Before grace period expires
      await time.increaseTo(startTime + terms.gracePeriod);
      expect(await subscriptionContract.canClaimFromPool()).to.be.false;
      
      // After grace period expires
      await time.increaseTo(startTime + terms.gracePeriod + 1);
      expect(await subscriptionContract.canClaimFromPool()).to.be.true;
    });

    it("Should not report payment due for paused subscription", async function () {
      await subscriptionContract.connect(user).pause();
      await time.increaseTo(startTime);
      expect(await subscriptionContract.isPaymentDue()).to.be.false;
    });

    it("Should not report payment due for cancelled subscription", async function () {
      const currentTime = await time.latest();
      const cancelData = {
        agreementId: terms.agreementId,
        nonce: 1,
        timestamp: currentTime,
      };
      // Use subscription contract's domain for cancellation
      const cancelDomain = {
        name: "PayGuard",
        version: "1", 
        chainId: 1337,
        verifyingContract: await subscriptionContract.getAddress(),
      };
      const signature = await user.signTypedData(cancelDomain, CANCEL_TYPES, cancelData);
      await subscriptionContract.connect(user).cancelByUser(signature, 1, currentTime);

      await time.increaseTo(startTime);
      expect(await subscriptionContract.isPaymentDue()).to.be.false;
    });
  });

  describe("Dispute Functionality", function () {
    beforeEach(async function () {
      // Make a payment first
      await time.increaseTo(startTime);
      await subscriptionContract.connect(user).pay();
    });

    it("Should allow raising disputes on paid periods", async function () {
      await expect(
        subscriptionContract.connect(user).raiseDispute(1, "Service not provided")
      ).to.emit(subscriptionContract, "DisputeRaised")
      .withArgs(1, user.address, "Service not provided");
    });

    it("Should allow agent to raise disputes", async function () {
      await expect(
        subscriptionContract.connect(agent).raiseDispute(1, "Quality issue")
      ).to.emit(subscriptionContract, "DisputeRaised")
      .withArgs(1, agent.address, "Quality issue");
    });

    it("Should not allow disputes on unpaid periods", async function () {
      await expect(
        subscriptionContract.connect(user).raiseDispute(2, "Invalid dispute")
      ).to.be.revertedWith("No payment for this period");
    });

    it("Should not allow non-authorized users to raise disputes", async function () {
      await expect(
        subscriptionContract.connect(provider).raiseDispute(1, "Invalid dispute")
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("Payment History and Debt Status", function () {
    beforeEach(async function () {
      await time.increaseTo(startTime);
      await subscriptionContract.connect(user).pay();
      
      // Move to next period and pay again
      await time.increaseTo(startTime + terms.period);
      await subscriptionContract.connect(user).pay();
    });

    it("Should return correct payment history", async function () {
      const history = await subscriptionContract.getPaymentHistory();
      expect(history.length).to.equal(2);
      
      expect(history[0].amount).to.equal(terms.amount);
      expect(history[0].fromPool).to.be.false;
      expect(history[0].payer).to.equal(user.address);
      
      expect(history[1].amount).to.equal(terms.amount);
      expect(history[1].fromPool).to.be.false;
      expect(history[1].payer).to.equal(user.address);
    });

    it("Should return correct debt status", async function () {
      const [poolDebt, nextDue, overdue] = await subscriptionContract.getDebtStatus();
      
      expect(poolDebt).to.equal(0); // No pool debt yet
      expect(nextDue).to.equal(BigInt(startTime) + BigInt(terms.period) * 2n);
      expect(overdue).to.be.false;
    });

    it("Should report overdue status correctly", async function () {
      // Move past next payment due
      await time.increaseTo(startTime + terms.period * 2 + 1);
      
      const [, , overdue] = await subscriptionContract.getDebtStatus();
      expect(overdue).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("Should only allow user or agent to call user functions", async function () {
      await expect(
        subscriptionContract.connect(provider).pause()
      ).to.be.revertedWith("Unauthorized");

      await expect(
        subscriptionContract.connect(provider).raiseDispute(1, "test")
      ).to.be.revertedWith("Unauthorized");
    });

    it("Should only allow provider to call provider functions", async function () {
      await expect(
        subscriptionContract.connect(user).emergencyCancel()
      ).to.be.revertedWith("Only provider");
    });

    it("Should prevent reinitialization", async function () {
      await expect(
        subscriptionContract.initialize(
          terms,
          await reservePool.getAddress(),
          await paymentPointNFT.getAddress()
        )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });
});