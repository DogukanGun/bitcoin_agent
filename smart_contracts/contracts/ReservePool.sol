// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IReservePool.sol";

contract ReservePool is IReservePool, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct PoolInfo {
        uint256 totalStaked;
        uint256 totalUtilized;
        uint256 totalRewards;
        uint256 utilizationRate;
        uint256 maxUtilizationRate; // Basis points (10000 = 100%)
    }

    mapping(address => mapping(address => UnderwriterInfo)) public underwriters; // token => underwriter => info
    mapping(address => PoolInfo) public pools; // token => pool info
    mapping(address => mapping(address => uint256)) public userCreditLines; // user => token => credit amount
    mapping(bytes32 => bool) public processedClaims;
    mapping(address => bool) public authorizedSubscriptions; // subscription contracts that can call this

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_UTILIZATION_RATE = 8000; // 80% max utilization
    uint256 public underwritingFee = 300; // 3%
    uint256 public platformFee = 100; // 1%
    
    address public subscriptionFactory;
    address public platformSigner;

    event StakeAdded(address indexed underwriter, address indexed token, uint256 amount, uint256 utilizationCap);
    event StakeRemoved(address indexed underwriter, address indexed token, uint256 amount);
    event ClaimPaid(bytes32 indexed claimId, address indexed subscription, address indexed provider, uint256 amount);
    event RepaymentReceived(address indexed user, address indexed token, uint256 amount, uint256 fee);
    event CreditLineGranted(address indexed user, address indexed token, uint256 amount, address indexed underwriter);
    event RewardsDistributed(address indexed underwriter, address indexed token, uint256 amount);
    event UtilizationRateUpdated(address indexed token, uint256 oldRate, uint256 newRate);

    modifier onlyAuthorizedSubscription() {
        require(authorizedSubscriptions[msg.sender], "Unauthorized subscription contract");
        _;
    }

    modifier onlyPlatformSigner() {
        require(msg.sender == platformSigner, "Only platform signer");
        _;
    }

    modifier validToken(address token) {
        require(token != address(0), "Invalid token address");
        _;
    }

    constructor(address _platformSigner) {
        require(_platformSigner != address(0), "Invalid platform signer");
        platformSigner = _platformSigner;
        
        // Initialize default max utilization rates for pools
        // This can be updated per token later
    }

    function addStake(
        address token,
        uint256 amount,
        uint256 utilizationCap
    ) external override nonReentrant whenNotPaused validToken(token) {
        require(amount > 0, "Amount must be > 0");
        require(utilizationCap >= amount, "Invalid utilization cap");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        UnderwriterInfo storage underwriter = underwriters[token][msg.sender];
        underwriter.stakeAmount += amount;
        underwriter.utilizationCap = utilizationCap;
        underwriter.active = true;

        PoolInfo storage pool = pools[token];
        pool.totalStaked += amount;
        
        // Set default max utilization rate if not set
        if (pool.maxUtilizationRate == 0) {
            pool.maxUtilizationRate = MAX_UTILIZATION_RATE;
        }

        emit StakeAdded(msg.sender, token, amount, utilizationCap);
    }

    function removeStake(address token, uint256 amount) external override nonReentrant validToken(token) {
        UnderwriterInfo storage underwriter = underwriters[token][msg.sender];
        require(underwriter.stakeAmount >= amount, "Insufficient stake");
        require(underwriter.currentUtilization == 0, "Active utilization exists");

        underwriter.stakeAmount -= amount;
        if (underwriter.stakeAmount == 0) {
            underwriter.active = false;
        }

        pools[token].totalStaked -= amount;

        IERC20(token).safeTransfer(msg.sender, amount);

        emit StakeRemoved(msg.sender, token, amount);
    }

    function grantCreditLine(
        address user,
        address token,
        uint256 amount
    ) external override validToken(token) {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be > 0");
        
        UnderwriterInfo storage underwriter = underwriters[token][msg.sender];
        require(underwriter.active, "Underwriter not active");
        require(
            underwriter.currentUtilization + amount <= underwriter.utilizationCap,
            "Exceeds utilization cap"
        );

        PoolInfo storage pool = pools[token];
        require(
            (pool.totalUtilized + amount) * FEE_DENOMINATOR <= pool.totalStaked * pool.maxUtilizationRate,
            "Exceeds pool utilization limit"
        );

        userCreditLines[user][token] += amount;
        underwriter.currentUtilization += amount;
        pool.totalUtilized += amount;
        pool.utilizationRate = (pool.totalUtilized * FEE_DENOMINATOR) / pool.totalStaked;

        emit CreditLineGranted(user, token, amount, msg.sender);
        emit UtilizationRateUpdated(token, pool.utilizationRate, pool.utilizationRate);
    }

    function payClaim(
        address subscription,
        address provider,
        address token,
        uint256 amount,
        bytes calldata claimProof,
        bytes calldata platformSig
    ) external override onlyAuthorizedSubscription nonReentrant returns (bool) {
        require(provider != address(0), "Invalid provider");
        require(amount > 0, "Invalid amount");
        
        bytes32 claimId = keccak256(abi.encode(subscription, provider, amount, block.timestamp));
        require(!processedClaims[claimId], "Claim already processed");

        PoolInfo storage pool = pools[token];
        require(pool.totalStaked >= amount, "Insufficient pool funds");

        // Verify platform signature and claim proof (simplified for this implementation)
        // In production, implement proper signature verification

        processedClaims[claimId] = true;

        // Transfer to provider
        IERC20(token).safeTransfer(provider, amount);

        // Update pool utilization
        pool.totalUtilized += amount;
        pool.utilizationRate = (pool.totalUtilized * FEE_DENOMINATOR) / pool.totalStaked;

        emit ClaimPaid(claimId, subscription, provider, amount);
        return true;
    }

    function repayFromUser(
        address user,
        address token,
        uint256 amount,
        uint256 fee
    ) external override onlyAuthorizedSubscription nonReentrant returns (bool) {
        require(user != address(0), "Invalid user");
        require(amount > 0, "Invalid amount");
        require(userCreditLines[user][token] >= amount, "Exceeds user debt");

        // Transfer repayment from subscription contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount + fee);

        userCreditLines[user][token] -= amount;
        
        PoolInfo storage pool = pools[token];
        pool.totalUtilized -= amount;
        pool.utilizationRate = pool.totalStaked > 0 ? (pool.totalUtilized * FEE_DENOMINATOR) / pool.totalStaked : 0;

        // Distribute fees to underwriters and platform
        uint256 underwriterFeeAmount = (fee * underwritingFee) / FEE_DENOMINATOR;
        uint256 platformFeeAmount = (fee * platformFee) / FEE_DENOMINATOR;

        pool.totalRewards += underwriterFeeAmount;

        // Transfer platform fee
        if (platformFeeAmount > 0) {
            IERC20(token).safeTransfer(platformSigner, platformFeeAmount);
        }

        emit RepaymentReceived(user, token, amount, fee);
        return true;
    }

    function getUnderwritingCapacity(address user, address token) 
        external 
        view 
        override 
        returns (uint256) 
    {
        return userCreditLines[user][token];
    }

    function getUnderwriterInfo(address token, address underwriter) 
        external 
        view 
        override 
        returns (UnderwriterInfo memory) 
    {
        return underwriters[token][underwriter];
    }

    function getPoolInfo(address token) external view returns (PoolInfo memory) {
        return pools[token];
    }

    function claimRewards(address token) external nonReentrant validToken(token) {
        UnderwriterInfo storage underwriter = underwriters[token][msg.sender];
        require(underwriter.rewardAccumulated > 0, "No rewards to claim");

        uint256 rewards = underwriter.rewardAccumulated;
        underwriter.rewardAccumulated = 0;

        IERC20(token).safeTransfer(msg.sender, rewards);

        emit RewardsDistributed(msg.sender, token, rewards);
    }

    function updateFees(uint256 _underwritingFee, uint256 _platformFee) external onlyOwner {
        require(_underwritingFee + _platformFee <= 1000, "Total fees too high"); // Max 10%
        underwritingFee = _underwritingFee;
        platformFee = _platformFee;
    }

    function setSubscriptionFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Invalid factory address");
        subscriptionFactory = _factory;
    }

    function setPlatformSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid signer address");
        platformSigner = _signer;
    }

    function authorizeSubscription(address subscription, bool authorized) external onlyOwner {
        require(subscription != address(0), "Invalid subscription address");
        authorizedSubscriptions[subscription] = authorized;
    }

    function setPoolMaxUtilizationRate(address token, uint256 maxRate) external onlyOwner validToken(token) {
        require(maxRate <= FEE_DENOMINATOR, "Rate too high");
        require(maxRate > 0, "Rate too low");
        
        PoolInfo storage pool = pools[token];
        uint256 oldRate = pool.maxUtilizationRate;
        pool.maxUtilizationRate = maxRate;
        
        emit UtilizationRateUpdated(token, oldRate, maxRate);
    }

    function emergencyPause() external onlyOwner {
        _pause();
    }

    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        IERC20(token).safeTransfer(owner(), amount);
    }

    function getPoolStats(address token) external view returns (
        uint256 totalStaked,
        uint256 totalUtilized,
        uint256 utilizationRate,
        uint256 maxUtilizationRate,
        uint256 availableCapacity
    ) {
        PoolInfo memory pool = pools[token];
        totalStaked = pool.totalStaked;
        totalUtilized = pool.totalUtilized;
        utilizationRate = pool.utilizationRate;
        maxUtilizationRate = pool.maxUtilizationRate;
        availableCapacity = totalStaked > totalUtilized ? totalStaked - totalUtilized : 0;
    }

    function getUserDebt(address user, address token) external view returns (uint256) {
        return userCreditLines[user][token];
    }

    function isSubscriptionAuthorized(address subscription) external view returns (bool) {
        return authorizedSubscriptions[subscription];
    }
}