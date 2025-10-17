import { ethers } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Starting deployment to Mezo chain...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (parseFloat(ethers.formatEther(balance)) < 0.1) {
    console.warn("⚠️  WARNING: Low balance. Please ensure you have enough ETH for deployment.");
  }

  // Deploy contracts in dependency order
  const contracts: { [key: string]: any } = {};
  const addresses: { [key: string]: string } = {};

  console.log("\n📦 1. Deploying PaymentPointNFT...");
  const PaymentPointNFT = await ethers.getContractFactory("PaymentPointNFT");
  contracts.paymentPointNFT = await PaymentPointNFT.deploy();
  await contracts.paymentPointNFT.waitForDeployment();
  addresses.PaymentPointNFT = await contracts.paymentPointNFT.getAddress();
  console.log("✅ PaymentPointNFT deployed to:", addresses.PaymentPointNFT);

  console.log("\n📦 2. Deploying ReservePool...");
  const ReservePool = await ethers.getContractFactory("ReservePool");
  contracts.reservePool = await ReservePool.deploy(deployer.address); // Platform signer
  await contracts.reservePool.waitForDeployment();
  addresses.ReservePool = await contracts.reservePool.getAddress();
  console.log("✅ ReservePool deployed to:", addresses.ReservePool);

  console.log("\n📦 3. Deploying SubscriptionFactory...");
  const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
  contracts.subscriptionFactory = await SubscriptionFactory.deploy(
    deployer.address, // Platform signer
    addresses.ReservePool
  );
  await contracts.subscriptionFactory.waitForDeployment();
  addresses.SubscriptionFactory = await contracts.subscriptionFactory.getAddress();
  console.log("✅ SubscriptionFactory deployed to:", addresses.SubscriptionFactory);

  console.log("\n🔗 4. Setting up contract relationships...");
  
  // Set factory in reserve pool
  const tx1 = await contracts.reservePool.setSubscriptionFactory(addresses.SubscriptionFactory);
  await tx1.wait();
  console.log("✅ Set SubscriptionFactory in ReservePool");

  // Set factory in payment point NFT
  const tx2 = await contracts.paymentPointNFT.setSubscriptionFactory(addresses.SubscriptionFactory);
  await tx2.wait();
  console.log("✅ Set SubscriptionFactory in PaymentPointNFT");

  // Update payment point NFT address in factory
  const tx3 = await contracts.subscriptionFactory.updatePaymentPointNFT(addresses.PaymentPointNFT);
  await tx3.wait();
  console.log("✅ Set PaymentPointNFT in SubscriptionFactory");

  console.log("\n📦 5. Deploying test token (for demo purposes)...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  contracts.testToken = await MockERC20.deploy(
    "Test Bitcoin Token",
    "tBTC",
    ethers.parseEther("1000000"), // 1M tokens
    18 // decimals
  );
  await contracts.testToken.waitForDeployment();
  addresses.TestToken = await contracts.testToken.getAddress();
  console.log("✅ Test token deployed to:", addresses.TestToken);

  // Get implementation addresses
  const [subImpl, agentImpl] = await contracts.subscriptionFactory.getImplementationAddresses();

  // Save deployment info
  const network = await deployer.provider.getNetwork();
  const deploymentInfo = {
    network: {
      name: "mezo",
      chainId: network.chainId.toString(),
    },
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    gasUsed: {
      // Could track gas usage here
    },
    contracts: {
      PaymentPointNFT: addresses.PaymentPointNFT,
      ReservePool: addresses.ReservePool,
      SubscriptionFactory: addresses.SubscriptionFactory,
      TestToken: addresses.TestToken,
      SubscriptionImplementation: subImpl,
      UserAgentImplementation: agentImpl,
    },
    verification: {
      PaymentPointNFT: {
        address: addresses.PaymentPointNFT,
        constructorArgs: [],
      },
      ReservePool: {
        address: addresses.ReservePool,
        constructorArgs: [deployer.address],
      },
      SubscriptionFactory: {
        address: addresses.SubscriptionFactory,
        constructorArgs: [deployer.address, addresses.ReservePool],
      },
      TestToken: {
        address: addresses.TestToken,
        constructorArgs: [
          "Test Bitcoin Token",
          "tBTC",
          ethers.parseEther("1000000").toString(),
          18,
        ],
      },
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = join(__dirname, "..", "deployments");
  try {
    mkdirSync(deploymentsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Save deployment info to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const deploymentFile = join(deploymentsDir, `mezo-${timestamp}.json`);
  writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 6. Deployment info saved to:", deploymentFile);

  // Save latest deployment info
  const latestFile = join(deploymentsDir, "latest.json");
  writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Latest deployment info saved to:", latestFile);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("PaymentPointNFT:           ", addresses.PaymentPointNFT);
  console.log("ReservePool:               ", addresses.ReservePool);
  console.log("SubscriptionFactory:       ", addresses.SubscriptionFactory);
  console.log("TestToken:                 ", addresses.TestToken);
  console.log("SubscriptionImplementation:", subImpl);
  console.log("UserAgentImplementation:   ", agentImpl);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n🔧 Next Steps:");
  console.log("1. Update your .env files with the contract addresses");
  console.log("2. Verify contracts on block explorer (if available)");
  console.log("3. Fund the test token contract if needed");
  console.log("4. Set up the backend with contract addresses");
  console.log("5. Deploy and configure the frontend");

  // Generate environment file template
  const envTemplate = `# Contract Addresses (Mezo Chain)
SUBSCRIPTION_FACTORY_ADDRESS=${addresses.SubscriptionFactory}
RESERVE_POOL_ADDRESS=${addresses.ReservePool}
PAYMENT_POINT_NFT_ADDRESS=${addresses.PaymentPointNFT}
TEST_TOKEN_ADDRESS=${addresses.TestToken}
SUBSCRIPTION_IMPLEMENTATION_ADDRESS=${subImpl}
USER_AGENT_IMPLEMENTATION_ADDRESS=${agentImpl}

# Network Configuration
MEZO_RPC_URL=https://rpc.mezo.org
CHAIN_ID=686868

# Deployer (Platform Signer)
PLATFORM_SIGNER_ADDRESS=${deployer.address}

# Update these with your actual keys
PRIVATE_KEY=your_private_key_here
AGENT_PRIVATE_KEY=your_agent_private_key_here
PLATFORM_SIGNER_KEY=your_platform_signer_key_here
`;

  const envFile = join(__dirname, "..", ".env.deployment");
  writeFileSync(envFile, envTemplate.trim());
  console.log("\n📝 Environment template saved to .env.deployment");
  console.log("   Copy the relevant values to your backend and frontend .env files");

  // Generate verification commands
  console.log("\n🔍 Verification Commands:");
  console.log("Run these commands to verify contracts on the block explorer:");
  console.log(`npx hardhat verify --network mezo ${addresses.PaymentPointNFT}`);
  console.log(`npx hardhat verify --network mezo ${addresses.ReservePool} "${deployer.address}"`);
  console.log(`npx hardhat verify --network mezo ${addresses.SubscriptionFactory} "${deployer.address}" "${addresses.ReservePool}"`);
  console.log(`npx hardhat verify --network mezo ${addresses.TestToken} "Test Bitcoin Token" "tBTC" "${ethers.parseEther("1000000").toString()}" "18"`);

  console.log("\n✨ Deployment Summary:");
  console.log(`- Total contracts deployed: ${Object.keys(addresses).length}`);
  console.log(`- Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`- Deployer: ${deployer.address}`);
  console.log(`- Timestamp: ${deploymentInfo.deploymentTime}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });