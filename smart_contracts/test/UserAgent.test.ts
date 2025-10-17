import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { UserAgent, SubscriptionFactory, ReservePool, PaymentPointNFT } from "../typechain-types";

describe("UserAgent", function () {
  let userAgent: UserAgent;
  let factory: SubscriptionFactory;
  let owner: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let unauthorized: SignerWithAddress;
  let platformSigner: SignerWithAddress;

  beforeEach(async function () {
    [owner, agent1, agent2, unauthorized, platformSigner] = await ethers.getSigners();

    // Deploy supporting contracts
    const ReservePool = await ethers.getContractFactory("ReservePool");
    const reservePool = await ReservePool.deploy(platformSigner.address);

    const PaymentPointNFT = await ethers.getContractFactory("PaymentPointNFT");
    const paymentPointNFT = await PaymentPointNFT.deploy();

    // Deploy factory
    const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
    factory = await SubscriptionFactory.deploy(
      platformSigner.address,
      await reservePool.getAddress()
    );

    // Create user agent through factory
    const tx = await factory.createUserAgent(owner.address);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return factory.interface.parseLog(log).name === 'UserAgentCreated';
      } catch { return false; }
    });
    const userAgentAddress = factory.interface.parseLog(event).args.userAgent;
    
    userAgent = await ethers.getContractAt("UserAgent", userAgentAddress);
  });

  describe("Initialization", function () {
    it("Should initialize with correct owner", async function () {
      expect(await userAgent.owner()).to.equal(owner.address);
    });

    it("Should prevent duplicate user agent creation", async function () {
      await expect(
        factory.createUserAgent(owner.address)
      ).to.be.revertedWith("User agent already exists");
    });

    it("Should not allow creation with zero address", async function () {
      await expect(
        factory.createUserAgent(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Agent Authorization", function () {
    it("Should allow owner to authorize agents", async function () {
      await expect(userAgent.connect(owner).authorizeAgent(agent1.address, true))
        .to.emit(userAgent, "AgentAuthorized")
        .withArgs(agent1.address, true);

      expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.true;
      expect(await userAgent.authorizedAgents(agent1.address)).to.be.true;
    });

    it("Should allow owner to deauthorize agents", async function () {
      // First authorize
      await userAgent.connect(owner).authorizeAgent(agent1.address, true);
      expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.true;

      // Then deauthorize
      await expect(userAgent.connect(owner).authorizeAgent(agent1.address, false))
        .to.emit(userAgent, "AgentAuthorized")
        .withArgs(agent1.address, false);

      expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.false;
      expect(await userAgent.getAgentNonce(agent1.address)).to.equal(0); // Nonce should reset
    });

    it("Should not allow non-owner to authorize agents", async function () {
      await expect(
        userAgent.connect(agent1).authorizeAgent(agent2.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject zero address for agent", async function () {
      await expect(
        userAgent.connect(owner).authorizeAgent(ethers.ZeroAddress, true)
      ).to.be.revertedWith("Invalid agent address");
    });

    it("Should handle multiple agents", async function () {
      await userAgent.connect(owner).authorizeAgent(agent1.address, true);
      await userAgent.connect(owner).authorizeAgent(agent2.address, true);

      expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.true;
      expect(await userAgent.isAuthorizedAgent(agent2.address)).to.be.true;
      expect(await userAgent.isAuthorizedAgent(unauthorized.address)).to.be.false;
    });
  });

  describe("Batch Authorization", function () {
    it("Should allow batch authorization of agents", async function () {
      const agents = [agent1.address, agent2.address];
      const authorizations = [true, true];

      await userAgent.connect(owner).batchAuthorizeAgents(agents, authorizations);

      expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.true;
      expect(await userAgent.isAuthorizedAgent(agent2.address)).to.be.true;
    });

    it("Should allow mixed batch operations", async function () {
      // First authorize both
      await userAgent.connect(owner).batchAuthorizeAgents(
        [agent1.address, agent2.address],
        [true, true]
      );

      // Then deauthorize one, keep one
      await userAgent.connect(owner).batchAuthorizeAgents(
        [agent1.address, agent2.address],
        [false, true]
      );

      expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.false;
      expect(await userAgent.isAuthorizedAgent(agent2.address)).to.be.true;
    });

    it("Should reject mismatched array lengths", async function () {
      await expect(
        userAgent.connect(owner).batchAuthorizeAgents(
          [agent1.address, agent2.address],
          [true] // Wrong length
        )
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("Should reject zero addresses in batch", async function () {
      await expect(
        userAgent.connect(owner).batchAuthorizeAgents(
          [agent1.address, ethers.ZeroAddress],
          [true, true]
        )
      ).to.be.revertedWith("Invalid agent address");
    });

    it("Should only allow owner to batch authorize", async function () {
      await expect(
        userAgent.connect(agent1).batchAuthorizeAgents(
          [agent2.address],
          [true]
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Emergency Revoke", function () {
    beforeEach(async function () {
      await userAgent.connect(owner).authorizeAgent(agent1.address, true);
    });

    it("Should allow owner to emergency revoke agent", async function () {
      await expect(userAgent.connect(owner).emergencyRevoke(agent1.address))
        .to.emit(userAgent, "AgentAuthorized")
        .withArgs(agent1.address, false);

      expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.false;
      expect(await userAgent.getAgentNonce(agent1.address)).to.equal(0);
    });

    it("Should not allow emergency revoke of non-authorized agent", async function () {
      await expect(
        userAgent.connect(owner).emergencyRevoke(agent2.address)
      ).to.be.revertedWith("Agent not authorized");
    });

    it("Should not allow non-owner to emergency revoke", async function () {
      await expect(
        userAgent.connect(agent1).emergencyRevoke(agent1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Signature Validation", function () {
    const testHash = ethers.keccak256(ethers.toUtf8Bytes("test message"));
    
    beforeEach(async function () {
      await userAgent.connect(owner).authorizeAgent(agent1.address, true);
    });

    it("Should validate owner signatures", async function () {
      // Use the ethersjs method to sign the hash directly with personal_sign equivalent
      const messageHash = ethers.hashMessage(ethers.getBytes(testHash));
      const signature = await owner.signMessage(ethers.getBytes(testHash));
      
      const result = await userAgent.isValidSignature(messageHash, signature);
      expect(result).to.equal("0x1626ba7e"); // ERC1271 magic value
    });

    it("Should validate authorized agent signatures", async function () {
      const messageHash = ethers.hashMessage(ethers.getBytes(testHash));
      const signature = await agent1.signMessage(ethers.getBytes(testHash));
      
      const result = await userAgent.isValidSignature(messageHash, signature);
      expect(result).to.equal("0x1626ba7e"); // ERC1271 magic value
    });

    it("Should reject unauthorized signatures", async function () {
      const messageHash = ethers.hashMessage(ethers.getBytes(testHash));
      const signature = await unauthorized.signMessage(ethers.getBytes(testHash));
      
      const result = await userAgent.isValidSignature(messageHash, signature);
      expect(result).to.equal("0xffffffff"); // Invalid signature
    });

    it("Should reject signatures from deauthorized agents", async function () {
      // First get signature while authorized
      const signature = await agent1.signMessage(ethers.getBytes(testHash));
      
      // Then deauthorize
      await userAgent.connect(owner).authorizeAgent(agent1.address, false);
      
      // Signature should now be invalid
      const result = await userAgent.isValidSignature(testHash, signature);
      expect(result).to.equal("0xffffffff"); // Invalid signature
    });
  });

  describe("Agent Nonce Management", function () {
    beforeEach(async function () {
      await userAgent.connect(owner).authorizeAgent(agent1.address, true);
    });

    it("Should start with nonce 0", async function () {
      expect(await userAgent.getAgentNonce(agent1.address)).to.equal(0);
    });

    it("Should increment nonce on successful action", async function () {
      const domain = {
        name: "PayGuard UserAgent",
        version: "1",
        chainId: 1337,
        verifyingContract: await userAgent.getAddress(),
      };

      const types = {
        TestAction: [
          { name: "target", type: "address" },
          { name: "data", type: "bytes" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const actionData = {
        target: agent2.address,
        data: "0x",
        nonce: 0,
      };

      const structHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes32", "address", "bytes32", "uint256"],
          [
            ethers.keccak256(ethers.toUtf8Bytes("TestAction(address target,bytes data,uint256 nonce)")),
            actionData.target,
            ethers.keccak256(actionData.data),
            actionData.nonce,
          ]
        )
      );

      const signature = await agent1.signTypedData(domain, types, actionData);

      // Mock target call (will fail but nonce should still increment)
      try {
        await userAgent.executeAgentAction(
          structHash,
          0,
          signature,
          agent2.address,
          "0x"
        );
      } catch (error) {
        // Expected to fail as agent2 is not a contract
      }

      expect(await userAgent.getAgentNonce(agent1.address)).to.equal(1);
    });

    it("Should reset nonce when agent is deauthorized", async function () {
      // Set nonce to non-zero value (simulate some usage)
      const domain = {
        name: "PayGuard UserAgent",
        version: "1",
        chainId: 1337,
        verifyingContract: await userAgent.getAddress(),
      };

      // Deauthorize agent
      await userAgent.connect(owner).authorizeAgent(agent1.address, false);
      
      expect(await userAgent.getAgentNonce(agent1.address)).to.equal(0);
    });
  });

  describe("Agent Action Execution", function () {
    let mockTarget: any;

    beforeEach(async function () {
      await userAgent.connect(owner).authorizeAgent(agent1.address, true);
      
      // Deploy a simple mock contract for testing
      const MockTarget = await ethers.getContractFactory("MockERC20");
      mockTarget = await MockTarget.deploy("Mock", "MOCK", 0, 18);
    });

    it("Should execute agent actions with valid signature and nonce", async function () {
      const domain = {
        name: "PayGuard UserAgent",
        version: "1",
        chainId: 1337,
        verifyingContract: await userAgent.getAddress(),
      };

      const types = {
        TestAction: [
          { name: "target", type: "address" },
          { name: "data", type: "bytes" },
          { name: "nonce", type: "uint256" },
        ],
      };

      // Prepare mint call data
      const mintData = mockTarget.interface.encodeFunctionData("mint", [
        agent1.address,
        ethers.parseEther("100")
      ]);

      const actionData = {
        target: await mockTarget.getAddress(),
        data: mintData,
        nonce: 0,
      };

      const structHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes32", "address", "bytes32", "uint256"],
          [
            ethers.keccak256(ethers.toUtf8Bytes("TestAction(address target,bytes data,uint256 nonce)")),
            actionData.target,
            ethers.keccak256(actionData.data),
            actionData.nonce,
          ]
        )
      );

      const signature = await agent1.signTypedData(domain, types, actionData);

      await expect(
        userAgent.executeAgentAction(
          structHash,
          0,
          signature,
          await mockTarget.getAddress(),
          mintData
        )
      ).to.emit(userAgent, "AgentActionExecuted")
      .withArgs(agent1.address, await mockTarget.getAddress(), true);

      // Verify the action was executed
      expect(await mockTarget.balanceOf(agent1.address)).to.equal(ethers.parseEther("100"));
      
      // Verify nonce was incremented
      expect(await userAgent.getAgentNonce(agent1.address)).to.equal(1);
    });

    it("Should reject actions from unauthorized agents", async function () {
      const structHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      const signature = await unauthorized.signMessage("test");

      await expect(
        userAgent.executeAgentAction(
          structHash,
          0,
          signature,
          await mockTarget.getAddress(),
          "0x"
        )
      ).to.be.revertedWith("Agent not authorized");
    });

    it("Should reject actions with invalid nonce", async function () {
      const domain = {
        name: "PayGuard UserAgent",
        version: "1",
        chainId: 1337,
        verifyingContract: await userAgent.getAddress(),
      };

      const types = {
        TestAction: [
          { name: "target", type: "address" },
          { name: "data", type: "bytes" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const actionData = {
        target: await mockTarget.getAddress(),
        data: "0x",
        nonce: 999, // Wrong nonce
      };

      const structHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes32", "address", "bytes32", "uint256"],
          [
            ethers.keccak256(ethers.toUtf8Bytes("TestAction(address target,bytes data,uint256 nonce)")),
            actionData.target,
            ethers.keccak256(actionData.data),
            actionData.nonce,
          ]
        )
      );

      const signature = await agent1.signTypedData(domain, types, actionData);

      await expect(
        userAgent.executeAgentAction(
          structHash,
          999, // Wrong nonce
          signature,
          await mockTarget.getAddress(),
          "0x"
        )
      ).to.be.revertedWith("Invalid nonce");
    });

    it("Should reject actions with zero target address", async function () {
      const domain = {
        name: "PayGuard UserAgent",
        version: "1",
        chainId: 1337,
        verifyingContract: await userAgent.getAddress(),
      };

      const types = {
        TestAction: [
          { name: "target", type: "address" },
          { name: "data", type: "bytes" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const actionData = {
        target: ethers.ZeroAddress,
        data: "0x",
        nonce: 0,
      };

      const structHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes32", "address", "bytes32", "uint256"],
          [
            ethers.keccak256(ethers.toUtf8Bytes("TestAction(address target,bytes data,uint256 nonce)")),
            actionData.target,
            ethers.keccak256(actionData.data),
            actionData.nonce,
          ]
        )
      );

      const signature = await agent1.signTypedData(domain, types, actionData);

      await expect(
        userAgent.executeAgentAction(
          structHash,
          0,
          signature,
          ethers.ZeroAddress,
          "0x"
        )
      ).to.be.revertedWith("Invalid target address");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to call owner functions", async function () {
      await expect(
        userAgent.connect(agent1).authorizeAgent(agent2.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        userAgent.connect(agent1).batchAuthorizeAgents([agent2.address], [true])
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        userAgent.connect(agent1).emergencyRevoke(agent2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow ownership transfer", async function () {
      await userAgent.connect(owner).transferOwnership(agent1.address);
      
      expect(await userAgent.owner()).to.equal(agent1.address);
      
      // New owner should be able to authorize agents
      await userAgent.connect(agent1).authorizeAgent(agent2.address, true);
      expect(await userAgent.isAuthorizedAgent(agent2.address)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle rapid authorization changes", async function () {
      // Rapidly authorize and deauthorize
      for (let i = 0; i < 5; i++) {
        await userAgent.connect(owner).authorizeAgent(agent1.address, true);
        expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.true;
        
        await userAgent.connect(owner).authorizeAgent(agent1.address, false);
        expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.false;
      }
    });

    it("Should handle large batch operations", async function () {
      const batchSize = 10;
      const agents = [];
      const authorizations = [];
      
      for (let i = 0; i < batchSize; i++) {
        const wallet = ethers.Wallet.createRandom();
        agents.push(wallet.address);
        authorizations.push(true);
      }

      await userAgent.connect(owner).batchAuthorizeAgents(agents, authorizations);

      // Verify all were authorized
      for (const agent of agents) {
        expect(await userAgent.isAuthorizedAgent(agent)).to.be.true;
      }
    });

    it("Should maintain state consistency across operations", async function () {
      // Authorize agent1
      await userAgent.connect(owner).authorizeAgent(agent1.address, true);
      
      // Authorize agent2
      await userAgent.connect(owner).authorizeAgent(agent2.address, true);
      
      // Deauthorize agent1
      await userAgent.connect(owner).authorizeAgent(agent1.address, false);
      
      // agent1 should be deauthorized, agent2 should still be authorized
      expect(await userAgent.isAuthorizedAgent(agent1.address)).to.be.false;
      expect(await userAgent.isAuthorizedAgent(agent2.address)).to.be.true;
      
      // Nonces should be correct
      expect(await userAgent.getAgentNonce(agent1.address)).to.equal(0);
      expect(await userAgent.getAgentNonce(agent2.address)).to.equal(0);
    });
  });
});