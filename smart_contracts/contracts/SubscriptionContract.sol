// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/IUserAgent.sol";
import "./interfaces/IReservePool.sol";
import "./interfaces/IPaymentPointNFT.sol";

contract SubscriptionContract is ReentrancyGuard, EIP712, Initializable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    enum SubscriptionStatus { ACTIVE, PAUSED, CANCELLED, DEFAULTED }

    struct SubscriptionTerms {
        bytes32 agreementId;
        address user;
        address userAgent;
        address provider;
        address token;
        uint256 amount;
        uint256 period;
        uint256 startDate;
        uint256 gracePeriod;
        uint256 maxCover;
    }

    struct PaymentRecord {
        uint256 dueDate;
        uint256 paidDate;
        uint256 amount;
        bool fromPool;
        address payer;
        uint256 nftTokenId;
    }

    SubscriptionTerms public terms;
    SubscriptionStatus public status;
    IReservePool public reservePool;
    IPaymentPointNFT public paymentPointNFT;
    
    uint256 public nextPaymentDue;
    uint256 public currentPeriod;
    uint256 public totalPaid;
    uint256 public totalFromPool;
    
    mapping(uint256 => PaymentRecord) public payments;
    mapping(bytes32 => bool) public usedClaims;

    event PaymentMade(uint256 indexed period, uint256 amount, address payer, bool fromPool, uint256 nftTokenId);
    event SubscriptionCancelled(address indexed canceller, uint256 timestamp);
    event ClaimProcessed(bytes32 indexed claimId, uint256 amount, uint256 timestamp);
    event RepaymentMade(uint256 amount, uint256 fee, uint256 timestamp);
    event DisputeRaised(uint256 indexed period, address disputer, string reason);
    event StatusChanged(SubscriptionStatus oldStatus, SubscriptionStatus newStatus);

    bytes32 public constant CANCEL_TYPEHASH = keccak256(
        "CancelSubscription(bytes32 agreementId,uint256 nonce,uint256 timestamp)"
    );

    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "PaymentClaim(bytes32 agreementId,uint256 period,uint256 amount,uint256 dueDate,uint256 timestamp)"
    );

    modifier onlyUserOrAgent() {
        require(
            msg.sender == terms.user || 
            IUserAgent(terms.userAgent).isAuthorizedAgent(msg.sender),
            "Unauthorized"
        );
        _;
    }

    modifier onlyProvider() {
        require(msg.sender == terms.provider, "Only provider");
        _;
    }

    modifier validStatus(SubscriptionStatus requiredStatus) {
        require(status == requiredStatus, "Invalid status");
        _;
    }

    modifier notCancelled() {
        require(status != SubscriptionStatus.CANCELLED, "Subscription cancelled");
        _;
    }

    constructor() EIP712("PayGuard", "1") {
        _disableInitializers();
    }

    function initialize(
        SubscriptionTerms memory _terms,
        address _reservePool,
        address _paymentPointNFT
    ) external initializer {
        require(_terms.user != address(0), "Invalid user");
        require(_terms.provider != address(0), "Invalid provider");
        require(_terms.token != address(0), "Invalid token");
        require(_terms.amount > 0, "Invalid amount");
        require(_terms.period > 0, "Invalid period");
        require(_reservePool != address(0), "Invalid reserve pool");
        require(_paymentPointNFT != address(0), "Invalid NFT contract");

        terms = _terms;
        reservePool = IReservePool(_reservePool);
        paymentPointNFT = IPaymentPointNFT(_paymentPointNFT);
        status = SubscriptionStatus.ACTIVE;
        nextPaymentDue = _terms.startDate;
        currentPeriod = 1;
    }

    function pay() external nonReentrant validStatus(SubscriptionStatus.ACTIVE) {
        require(block.timestamp >= nextPaymentDue - terms.gracePeriod, "Payment not due yet");
        require(payments[currentPeriod].paidDate == 0, "Already paid for this period");

        IERC20(terms.token).safeTransferFrom(msg.sender, terms.provider, terms.amount);

        // Mint NFT for successful payment
        uint256 nftTokenId = paymentPointNFT.mintPaymentPoint(
            terms.user,
            address(this),
            terms.amount,
            "On-time payment",
            true // soulbound
        );

        payments[currentPeriod] = PaymentRecord({
            dueDate: nextPaymentDue,
            paidDate: block.timestamp,
            amount: terms.amount,
            fromPool: false,
            payer: msg.sender,
            nftTokenId: nftTokenId
        });

        totalPaid += terms.amount;
        nextPaymentDue += terms.period;
        currentPeriod++;

        emit PaymentMade(currentPeriod - 1, terms.amount, msg.sender, false, nftTokenId);
    }

    function cancelByUser(bytes memory signature, uint256 nonce, uint256 timestamp) 
        external 
        nonReentrant 
        validStatus(SubscriptionStatus.ACTIVE) 
    {
        require(timestamp <= block.timestamp + 300, "Timestamp too far in future"); // 5 min tolerance
        require(timestamp >= block.timestamp - 300, "Timestamp too old"); // 5 min tolerance
        
        bytes32 structHash = keccak256(abi.encode(
            CANCEL_TYPEHASH,
            terms.agreementId,
            nonce,
            timestamp
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        require(
            signer == terms.user || 
            IUserAgent(terms.userAgent).isAuthorizedAgent(signer),
            "Invalid signature"
        );

        SubscriptionStatus oldStatus = status;
        status = SubscriptionStatus.CANCELLED;
        
        emit StatusChanged(oldStatus, status);
        emit SubscriptionCancelled(signer, block.timestamp);
    }

    function claimFromPool(
        bytes32 claimId,
        bytes memory claimProof,
        bytes memory platformSig
    ) external nonReentrant validStatus(SubscriptionStatus.ACTIVE) {
        require(!usedClaims[claimId], "Claim already used");
        require(block.timestamp > nextPaymentDue + terms.gracePeriod, "Grace period not expired");
        require(payments[currentPeriod].paidDate == 0, "Already paid");

        bytes32 structHash = keccak256(abi.encode(
            CLAIM_TYPEHASH,
            terms.agreementId,
            currentPeriod,
            terms.amount,
            nextPaymentDue,
            block.timestamp
        ));

        usedClaims[claimId] = true;

        bool success = reservePool.payClaim(
            address(this),
            terms.provider,
            terms.token,
            terms.amount,
            claimProof,
            platformSig
        );

        require(success, "Pool payment failed");

        payments[currentPeriod] = PaymentRecord({
            dueDate: nextPaymentDue,
            paidDate: block.timestamp,
            amount: terms.amount,
            fromPool: true,
            payer: address(reservePool),
            nftTokenId: 0 // No NFT for pool payments
        });

        totalFromPool += terms.amount;
        nextPaymentDue += terms.period;
        currentPeriod++;

        emit ClaimProcessed(claimId, terms.amount, block.timestamp);
        emit PaymentMade(currentPeriod - 1, terms.amount, address(reservePool), true, 0);
    }

    function repayFromUser(uint256 amount, uint256 fee) 
        external 
        onlyUserOrAgent 
        nonReentrant 
    {
        require(totalFromPool > 0, "No pool debt");
        require(amount <= totalFromPool, "Amount exceeds debt");

        IERC20(terms.token).safeTransferFrom(msg.sender, address(this), amount + fee);
        
        IERC20(terms.token).safeApprove(address(reservePool), amount + fee);
        
        bool success = reservePool.repayFromUser(terms.user, terms.token, amount, fee);
        require(success, "Repayment failed");

        totalFromPool -= amount;

        // Mint NFT for repayment
        uint256 nftTokenId = paymentPointNFT.mintPaymentPoint(
            terms.user,
            address(this),
            amount,
            "Pool repayment",
            true
        );

        emit RepaymentMade(amount, fee, block.timestamp);
    }

    function pause() external onlyUserOrAgent validStatus(SubscriptionStatus.ACTIVE) {
        SubscriptionStatus oldStatus = status;
        status = SubscriptionStatus.PAUSED;
        emit StatusChanged(oldStatus, status);
    }

    function resume() external onlyUserOrAgent validStatus(SubscriptionStatus.PAUSED) {
        SubscriptionStatus oldStatus = status;
        status = SubscriptionStatus.ACTIVE;
        emit StatusChanged(oldStatus, status);
    }

    function raiseDispute(uint256 period, string memory reason) external onlyUserOrAgent {
        require(payments[period].paidDate > 0, "No payment for this period");
        emit DisputeRaised(period, msg.sender, reason);
    }

    function emergencyCancel() external onlyProvider {
        require(status == SubscriptionStatus.ACTIVE || status == SubscriptionStatus.PAUSED, "Invalid status");
        SubscriptionStatus oldStatus = status;
        status = SubscriptionStatus.CANCELLED;
        emit StatusChanged(oldStatus, status);
        emit SubscriptionCancelled(msg.sender, block.timestamp);
    }

    // View functions
    function getPaymentInfo(uint256 period) external view returns (PaymentRecord memory) {
        return payments[period];
    }

    function getSubscriptionInfo() external view returns (
        SubscriptionTerms memory,
        SubscriptionStatus,
        uint256,
        uint256,
        uint256,
        uint256
    ) {
        return (terms, status, nextPaymentDue, currentPeriod, totalPaid, totalFromPool);
    }

    function isPaymentDue() external view returns (bool) {
        return block.timestamp >= nextPaymentDue && 
               payments[currentPeriod].paidDate == 0 &&
               status == SubscriptionStatus.ACTIVE;
    }

    function isInGracePeriod() external view returns (bool) {
        return block.timestamp > nextPaymentDue && 
               block.timestamp <= nextPaymentDue + terms.gracePeriod &&
               payments[currentPeriod].paidDate == 0 &&
               status == SubscriptionStatus.ACTIVE;
    }

    function canClaimFromPool() external view returns (bool) {
        return block.timestamp > nextPaymentDue + terms.gracePeriod &&
               payments[currentPeriod].paidDate == 0 &&
               status == SubscriptionStatus.ACTIVE;
    }

    function getPaymentHistory() external view returns (PaymentRecord[] memory) {
        PaymentRecord[] memory history = new PaymentRecord[](currentPeriod - 1);
        for (uint256 i = 1; i < currentPeriod; i++) {
            history[i - 1] = payments[i];
        }
        return history;
    }

    function getDebtStatus() external view returns (uint256 poolDebt, uint256 nextDue, bool overdue) {
        poolDebt = totalFromPool;
        nextDue = nextPaymentDue;
        overdue = block.timestamp > nextPaymentDue && 
                  payments[currentPeriod].paidDate == 0 &&
                  status == SubscriptionStatus.ACTIVE;
    }
}