import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {
  SubscriptionFactory,
  UserAgent,
  ReservePool,
  PaymentPointNFT,
  MockERC20,
  SubscriptionContract
} from "../typechain-types";

describe("SubscriptionFactory", function () {
  let subscriptionFactory: SubscriptionFactory;
  let reservePool: ReservePool;
  let paymentPointNFT: PaymentPointNFT;
  let mockToken: MockERC20;
  
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let provider: SignerWithAddress;
  let platformSigner: SignerWithAddress;

  const DOMAIN = {
    name: "PayGuard",
    version: "1",
    chainId: 1337, // Hardhat network
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

  beforeEach(async function () {
    [owner, user, provider, platformSigner] = await ethers.getSigners();

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
    reservePool = await ReservePool.deploy(platformSigner.address);

    // Deploy SubscriptionFactory
    const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
    subscriptionFactory = await SubscriptionFactory.deploy(
      platformSigner.address,
      await reservePool.getAddress()
    );

    // Set factory in reserve pool
    await reservePool.setSubscriptionFactory(await subscriptionFactory.getAddress());

    // Set factory in payment point NFT
    await paymentPointNFT.setSubscriptionFactory(await subscriptionFactory.getAddress());

    // Set payment point NFT in factory
    await subscriptionFactory.updatePaymentPointNFT(await paymentPointNFT.getAddress());

    // Update domain verifying contract
    DOMAIN.verifyingContract = await subscriptionFactory.getAddress();
  });

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      expect(await subscriptionFactory.platformSigner()).to.equal(platformSigner.address);
      expect(await subscriptionFactory.reservePool()).to.equal(await reservePool.getAddress());
    });

    it("Should deploy implementation contracts", async function () {
      const [subImpl, agentImpl] = await subscriptionFactory.getImplementationAddresses();
      expect(subImpl).to.not.equal(ethers.ZeroAddress);
      expect(agentImpl).to.not.equal(ethers.ZeroAddress);
    });

    it("Should reject zero addresses in constructor", async function () {
      const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
      
      await expect(
        SubscriptionFactory.deploy(ethers.ZeroAddress, await reservePool.getAddress())
      ).to.be.revertedWith("Invalid address");

      await expect(
        SubscriptionFactory.deploy(platformSigner.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("User Agent Creation", function () {
    it("Should create a user agent for a new user", async function () {
      const tx = await subscriptionFactory.createUserAgent(user.address);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = subscriptionFactory.interface.parseLog(log);
          return parsedLog?.name === "UserAgentCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      // Check user agent mapping
      const userAgentAddress = await subscriptionFactory.userAgents(user.address);
      expect(userAgentAddress).to.not.equal(ethers.ZeroAddress);

      // Verify it's a valid UserAgent contract
      const UserAgent = await ethers.getContractFactory("UserAgent");
      const userAgent = UserAgent.attach(userAgentAddress);
      expect(await userAgent.owner()).to.equal(user.address);
    });

    it("Should not create duplicate user agents", async function () {
      await subscriptionFactory.createUserAgent(user.address);
      await expect(
        subscriptionFactory.createUserAgent(user.address)
      ).to.be.revertedWith("User agent already exists");
    });

    it("Should reject zero address", async function () {
      await expect(
        subscriptionFactory.createUserAgent(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Subscription Creation", function () {
    let agreementData: any;
    let agreementId: string;

    beforeEach(async function () {
      // Create user agent first
      await subscriptionFactory.createUserAgent(user.address);

      const currentTime = await time.latest();
      agreementData = {
        user: user.address,
        provider: provider.address,
        token: await mockToken.getAddress(),
        amount: ethers.parseEther("10"),
        period: 2592000, // 30 days
        startDate: Number(currentTime) + 3600, // 1 hour from now
        gracePeriod: 86400, // 1 day
        maxCover: ethers.parseEther("50"),
        nonce: 1,
      };

      agreementId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "address", "address", "uint256", "uint256"],
          [
            agreementData.user,
            agreementData.provider,
            agreementData.token,
            agreementData.amount,
            agreementData.startDate,
          ]
        )
      );

      agreementData.agreementId = agreementId;
    });

    it("Should create a subscription with valid signatures", async function () {
      // Sign agreement
      const providerSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);
      const userSignature = await user.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);

      // Create subscription
      const tx = await subscriptionFactory.createSubscription(
        agreementData,
        providerSignature,
        userSignature
      );

      const receipt = await tx.wait();

      // Check event
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = subscriptionFactory.interface.parseLog(log);
          return parsedLog?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const parsedEvent = subscriptionFactory.interface.parseLog(event!);
      const subscriptionAddress = parsedEvent?.args.subscription;

      // Verify subscription was created
      expect(await subscriptionFactory.subscriptions(agreementId)).to.equal(subscriptionAddress);

      // Verify user subscriptions list
      const userSubscriptions = await subscriptionFactory.getUserSubscriptions(user.address);
      expect(userSubscriptions).to.include(subscriptionAddress);

      // Verify subscription contract is properly initialized
      const SubscriptionContract = await ethers.getContractFactory("SubscriptionContract");
      const subscription = SubscriptionContract.attach(subscriptionAddress);
      const [terms] = await subscription.getSubscriptionInfo();
      
      expect(terms.user).to.equal(user.address);
      expect(terms.provider).to.equal(provider.address);
      expect(terms.amount).to.equal(agreementData.amount);
    });

    it("Should auto-create user agent if not exists", async function () {
      // Don't create user agent beforehand
      const newUser = (await ethers.getSigners())[4];
      
      const newAgreementData = {
        ...agreementData,
        user: newUser.address,
        agreementId: ethers.keccak256(ethers.toUtf8Bytes("new-agreement")),
      };

      const providerSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, newAgreementData);
      const userSignature = await newUser.signTypedData(DOMAIN, AGREEMENT_TYPES, newAgreementData);

      await subscriptionFactory.createSubscription(
        newAgreementData,
        providerSignature,
        userSignature
      );

      // Verify user agent was created
      const userAgentAddress = await subscriptionFactory.userAgents(newUser.address);
      expect(userAgentAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should reject invalid provider signature", async function () {
      const invalidProviderSignature = await user.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);
      const userSignature = await user.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);

      await expect(
        subscriptionFactory.createSubscription(
          agreementData,
          invalidProviderSignature,
          userSignature
        )
      ).to.be.revertedWith("Invalid provider signature");
    });

    it("Should reject invalid user signature", async function () {
      const providerSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);
      const invalidUserSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);

      await expect(
        subscriptionFactory.createSubscription(
          agreementData,
          providerSignature,
          invalidUserSignature
        )
      ).to.be.revertedWith("Invalid user signature");
    });

    it("Should reject duplicate agreement IDs", async function () {
      const providerSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);
      const userSignature = await user.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);

      // Create first subscription
      await subscriptionFactory.createSubscription(
        agreementData,
        providerSignature,
        userSignature
      );

      // Try to create duplicate
      await expect(
        subscriptionFactory.createSubscription(
          agreementData,
          providerSignature,
          userSignature
        )
      ).to.be.revertedWith("Agreement already exists");
    });

    it("Should reject invalid agreement parameters", async function () {
      const providerSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);
      const userSignature = await user.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);

      // Test invalid user address
      const invalidAgreement1 = { ...agreementData, user: ethers.ZeroAddress };
      await expect(
        subscriptionFactory.createSubscription(invalidAgreement1, providerSignature, userSignature)
      ).to.be.revertedWith("Invalid user address");

      // Test invalid provider address
      const invalidAgreement2 = { ...agreementData, provider: ethers.ZeroAddress };
      await expect(
        subscriptionFactory.createSubscription(invalidAgreement2, providerSignature, userSignature)
      ).to.be.revertedWith("Invalid provider address");

      // Test invalid token address
      const invalidAgreement3 = { ...agreementData, token: ethers.ZeroAddress };
      await expect(
        subscriptionFactory.createSubscription(invalidAgreement3, providerSignature, userSignature)
      ).to.be.revertedWith("Invalid token address");

      // Test zero amount
      const invalidAgreement4 = { ...agreementData, amount: 0 };
      await expect(
        subscriptionFactory.createSubscription(invalidAgreement4, providerSignature, userSignature)
      ).to.be.revertedWith("Amount must be greater than 0");

      // Test zero period
      const invalidAgreement5 = { ...agreementData, period: 0 };
      await expect(
        subscriptionFactory.createSubscription(invalidAgreement5, providerSignature, userSignature)
      ).to.be.revertedWith("Period must be greater than 0");

      // Test past start date
      const pastTime = (await time.latest()) - 3600;
      const invalidAgreement6 = { ...agreementData, startDate: pastTime };
      await expect(
        subscriptionFactory.createSubscription(invalidAgreement6, providerSignature, userSignature)
      ).to.be.revertedWith("Start date must be in the future");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform signer", async function () {
      const newSigner = (await ethers.getSigners())[4];
      
      await subscriptionFactory.updatePlatformSigner(newSigner.address);
      expect(await subscriptionFactory.platformSigner()).to.equal(newSigner.address);
    });

    it("Should not allow non-owner to update platform signer", async function () {
      const newSigner = (await ethers.getSigners())[4];
      
      await expect(
        subscriptionFactory.connect(user).updatePlatformSigner(newSigner.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject zero address for platform signer", async function () {
      await expect(
        subscriptionFactory.updatePlatformSigner(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should allow owner to update reserve pool", async function () {
      const ReservePool = await ethers.getContractFactory("ReservePool");
      const newReservePool = await ReservePool.deploy(platformSigner.address);
      
      await subscriptionFactory.updateReservePool(await newReservePool.getAddress());
      expect(await subscriptionFactory.reservePool()).to.equal(await newReservePool.getAddress());
    });

    it("Should allow owner to update payment point NFT", async function () {
      const PaymentPointNFT = await ethers.getContractFactory("PaymentPointNFT");
      const newNFT = await PaymentPointNFT.deploy();
      
      await subscriptionFactory.updatePaymentPointNFT(await newNFT.getAddress());
      expect(await subscriptionFactory.paymentPointNFT()).to.equal(await newNFT.getAddress());
    });
  });

  describe("View Functions", function () {
    let subscriptionAddress: string;

    beforeEach(async function () {
      // Create a subscription for testing
      await subscriptionFactory.createUserAgent(user.address);
      
      const currentTime = await time.latest();
      const agreementData = {
        agreementId: ethers.keccak256(ethers.toUtf8Bytes("test-agreement")),
        user: user.address,
        provider: provider.address,
        token: await mockToken.getAddress(),
        amount: ethers.parseEther("10"),
        period: 2592000,
        startDate: currentTime + 3600,
        gracePeriod: 86400,
        maxCover: ethers.parseEther("50"),
        nonce: 1,
      };

      const providerSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);
      const userSignature = await user.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);

      await subscriptionFactory.createSubscription(
        agreementData,
        providerSignature,
        userSignature
      );

      subscriptionAddress = await subscriptionFactory.subscriptions(agreementData.agreementId);
    });

    it("Should return user subscriptions", async function () {
      const userSubscriptions = await subscriptionFactory.getUserSubscriptions(user.address);
      expect(userSubscriptions.length).to.equal(1);
      expect(userSubscriptions[0]).to.equal(subscriptionAddress);
    });

    it("Should return subscription by agreement ID", async function () {
      const agreementId = ethers.keccak256(ethers.toUtf8Bytes("test-agreement"));
      const result = await subscriptionFactory.getSubscription(agreementId);
      expect(result).to.equal(subscriptionAddress);
    });

    it("Should return user agent address", async function () {
      const userAgentAddress = await subscriptionFactory.getUserAgent(user.address);
      expect(userAgentAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should return empty array for user with no subscriptions", async function () {
      const newUser = (await ethers.getSigners())[4];
      const subscriptions = await subscriptionFactory.getUserSubscriptions(newUser.address);
      expect(subscriptions.length).to.equal(0);
    });
  });

  describe("Integration Tests", function () {
    it("Should create complete subscription workflow", async function () {
      // 1. Create user agent
      await subscriptionFactory.createUserAgent(user.address);
      const userAgentAddress = await subscriptionFactory.userAgents(user.address);

      // 2. Authorize an agent
      const UserAgent = await ethers.getContractFactory("UserAgent");
      const userAgent = UserAgent.attach(userAgentAddress);
      const agentAddress = (await ethers.getSigners())[4].address;
      await userAgent.connect(user).authorizeAgent(agentAddress, true);

      // 3. Create subscription with agent signature
      const currentTime = await time.latest();
      const agreementData = {
        agreementId: ethers.keccak256(ethers.toUtf8Bytes("agent-test")),
        user: user.address,
        provider: provider.address,
        token: await mockToken.getAddress(),
        amount: ethers.parseEther("5"),
        period: 86400, // 1 day
        startDate: currentTime + 1800, // 30 minutes from now
        gracePeriod: 3600, // 1 hour
        maxCover: ethers.parseEther("25"),
        nonce: 1,
      };

      const providerSignature = await provider.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);
      const agentSigner = (await ethers.getSigners())[4];
      const agentSignature = await agentSigner.signTypedData(DOMAIN, AGREEMENT_TYPES, agreementData);

      // Should succeed with agent signature
      await subscriptionFactory.createSubscription(
        agreementData,
        providerSignature,
        agentSignature
      );

      // Verify subscription exists
      const subscriptionAddress = await subscriptionFactory.subscriptions(agreementData.agreementId);
      expect(subscriptionAddress).to.not.equal(ethers.ZeroAddress);
    });
  });
});