// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SubscriptionContract.sol";
import "./UserAgent.sol";
import "./interfaces/ISubscriptionFactory.sol";
import "./interfaces/IUserAgent.sol";

contract SubscriptionFactory is ISubscriptionFactory, Ownable, EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    address public subscriptionImplementation;
    address public userAgentImplementation;
    address public reservePool;
    address public paymentPointNFT;
    address public platformSigner;

    mapping(bytes32 => address) public subscriptions;
    mapping(address => address[]) public userSubscriptions;
    mapping(address => address) public userAgents;

    event SubscriptionCreated(
        bytes32 indexed agreementId,
        address indexed user,
        address indexed provider,
        address subscription,
        address userAgent
    );

    event UserAgentCreated(address indexed user, address indexed userAgent);

    bytes32 public constant AGREEMENT_TYPEHASH = keccak256(
        "PaymentAgreement(bytes32 agreementId,address user,address provider,address token,uint256 amount,uint256 period,uint256 startDate,uint256 gracePeriod,uint256 maxCover,uint256 nonce)"
    );

    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    constructor(
        address _platformSigner,
        address _reservePool
    ) EIP712("PayGuard", "1") validAddress(_platformSigner) validAddress(_reservePool) {
        platformSigner = _platformSigner;
        reservePool = _reservePool;
        
        // Deploy implementation contracts
        subscriptionImplementation = address(new SubscriptionContract());
        userAgentImplementation = address(new UserAgent());
    }

    function createUserAgent(address user) public override validAddress(user) returns (address) {
        require(userAgents[user] == address(0), "User agent already exists");

        address userAgent = Clones.clone(userAgentImplementation);
        UserAgent(userAgent).initialize(user, "PayGuard UserAgent", "1");
        
        userAgents[user] = userAgent;
        
        emit UserAgentCreated(user, userAgent);
        return userAgent;
    }

    function createSubscription(
        PaymentAgreement memory agreement,
        bytes memory providerSig,
        bytes memory userSig
    ) external override nonReentrant returns (address) {
        require(subscriptions[agreement.agreementId] == address(0), "Agreement already exists");
        require(agreement.user != address(0), "Invalid user address");
        require(agreement.provider != address(0), "Invalid provider address");
        require(agreement.token != address(0), "Invalid token address");
        require(agreement.amount > 0, "Amount must be greater than 0");
        require(agreement.period > 0, "Period must be greater than 0");
        require(agreement.startDate > block.timestamp, "Start date must be in the future");

        // Verify signatures
        bytes32 structHash = keccak256(abi.encode(
            AGREEMENT_TYPEHASH,
            agreement.agreementId,
            agreement.user,
            agreement.provider,
            agreement.token,
            agreement.amount,
            agreement.period,
            agreement.startDate,
            agreement.gracePeriod,
            agreement.maxCover,
            agreement.nonce
        ));

        bytes32 hash = _hashTypedDataV4(structHash);

        // Verify provider signature
        address providerSigner = hash.recover(providerSig);
        require(providerSigner == agreement.provider, "Invalid provider signature");

        // Get or create user agent
        address userAgent = userAgents[agreement.user];
        if (userAgent == address(0)) {
            userAgent = createUserAgent(agreement.user);
        }

        // Verify user signature (can be from user or authorized agent)
        address userSigner = hash.recover(userSig);
        require(
            userSigner == agreement.user || 
            IUserAgent(userAgent).isAuthorizedAgent(userSigner),
            "Invalid user signature"
        );

        // Create subscription contract
        address subscription = Clones.clone(subscriptionImplementation);
        
        SubscriptionContract.SubscriptionTerms memory terms = SubscriptionContract.SubscriptionTerms({
            agreementId: agreement.agreementId,
            user: agreement.user,
            userAgent: userAgent,
            provider: agreement.provider,
            token: agreement.token,
            amount: agreement.amount,
            period: agreement.period,
            startDate: agreement.startDate,
            gracePeriod: agreement.gracePeriod,
            maxCover: agreement.maxCover
        });

        SubscriptionContract(subscription).initialize(terms, reservePool, paymentPointNFT);

        subscriptions[agreement.agreementId] = subscription;
        userSubscriptions[agreement.user].push(subscription);

        emit SubscriptionCreated(agreement.agreementId, agreement.user, agreement.provider, subscription, userAgent);
        
        return subscription;
    }

    function getUserSubscriptions(address user) external view override returns (address[] memory) {
        return userSubscriptions[user];
    }

    function getSubscription(bytes32 agreementId) external view override returns (address) {
        return subscriptions[agreementId];
    }

    function getUserAgent(address user) external view returns (address) {
        return userAgents[user];
    }

    function updatePlatformSigner(address newSigner) external onlyOwner validAddress(newSigner) {
        platformSigner = newSigner;
    }

    function updateReservePool(address newPool) external onlyOwner validAddress(newPool) {
        reservePool = newPool;
    }

    function updatePaymentPointNFT(address newNFT) external onlyOwner validAddress(newNFT) {
        paymentPointNFT = newNFT;
    }

    function getImplementationAddresses() external view returns (address, address) {
        return (subscriptionImplementation, userAgentImplementation);
    }
}