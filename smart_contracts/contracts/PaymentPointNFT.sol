// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./interfaces/IPaymentPointNFT.sol";

contract PaymentPointNFT is IPaymentPointNFT, ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => PaymentPoint) public paymentPoints;
    mapping(address => uint256[]) public userPoints;
    mapping(address => uint256) public userScores;
    mapping(address => bool) public authorizedMinters;

    address public subscriptionFactory;
    uint256 public baseScore = 100;
    uint256 public bonusMultiplier = 110; // 10% bonus for consecutive payments
    uint256 public maxConsecutiveBonus = 500; // Max 5x bonus

    event PaymentPointMinted(
        uint256 indexed tokenId,
        address indexed user,
        address indexed subscription,
        uint256 score,
        bool soulbound
    );

    event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event MinterAuthorized(address indexed minter, bool authorized);

    modifier onlyAuthorizedMinter() {
        require(
            authorizedMinters[msg.sender] || 
            msg.sender == subscriptionFactory || 
            msg.sender == owner(),
            "Unauthorized minter"
        );
        _;
    }

    constructor() ERC721("PaymentPoint", "PPNT") {
        _tokenIdCounter.increment(); // Start token IDs at 1
    }

    function mintPaymentPoint(
        address user,
        address subscription,
        uint256 amount,
        string memory metadata,
        bool soulbound
    ) external override onlyAuthorizedMinter nonReentrant returns (uint256) {
        require(user != address(0), "Invalid user address");
        require(subscription != address(0), "Invalid subscription address");
        require(amount > 0, "Invalid amount");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        uint256 score = calculateScore(user, amount);
        uint256 oldScore = userScores[user];

        paymentPoints[tokenId] = PaymentPoint({
            user: user,
            subscription: subscription,
            amount: amount,
            timestamp: block.timestamp,
            score: score,
            metadata: metadata,
            soulbound: soulbound
        });

        userPoints[user].push(tokenId);
        userScores[user] += score;

        _safeMint(user, tokenId);

        emit PaymentPointMinted(tokenId, user, subscription, score, soulbound);
        emit ScoreUpdated(user, oldScore, userScores[user]);

        return tokenId;
    }

    function calculateScore(address user, uint256 amount) internal view returns (uint256) {
        uint256 consecutivePayments = getConsecutivePayments(user);
        uint256 score = baseScore;

        // Bonus for consecutive payments (capped)
        if (consecutivePayments > 0) {
            uint256 bonusMultiplierPow = consecutivePayments;
            if (bonusMultiplierPow > 5) bonusMultiplierPow = 5; // Cap at 5 consecutive payments
            
            for (uint256 i = 0; i < bonusMultiplierPow; i++) {
                score = (score * bonusMultiplier) / 100;
            }
            
            if (score > maxConsecutiveBonus) {
                score = maxConsecutiveBonus;
            }
        }

        // Amount-based multiplier (1 point per 1000 units, scaled by 18 decimals)
        uint256 amountBonus = amount / 1e18; // Assuming 18 decimal token
        score += amountBonus;

        // Minimum score
        if (score < baseScore) {
            score = baseScore;
        }

        return score;
    }

    function getConsecutivePayments(address user) internal view returns (uint256) {
        uint256[] memory points = userPoints[user];
        if (points.length < 2) return 0;

        uint256 consecutive = 0;
        uint256 lastTimestamp = block.timestamp;
        
        // Check from most recent backwards
        for (uint256 i = points.length; i > 0; i--) {
            uint256 pointTimestamp = paymentPoints[points[i-1]].timestamp;
            
            // If this is the first point we're checking, just set the reference
            if (i == points.length) {
                lastTimestamp = pointTimestamp;
                consecutive = 1;
                continue;
            }
            
            // Check if payments are within reasonable timeframe (35 days for monthly payments)
            if (lastTimestamp - pointTimestamp <= 35 days && lastTimestamp - pointTimestamp >= 25 days) {
                consecutive++;
                lastTimestamp = pointTimestamp;
            } else {
                break;
            }
        }

        return consecutive > 1 ? consecutive - 1 : 0; // Return bonus consecutive payments
    }

    function getUserScore(address user) external view override returns (uint256) {
        return userScores[user];
    }

    function getUserPoints(address user) external view override returns (uint256[] memory) {
        return userPoints[user];
    }

    function getPaymentPoint(uint256 tokenId) external view override returns (PaymentPoint memory) {
        require(_exists(tokenId), "Token does not exist");
        return paymentPoints[tokenId];
    }

    function getUserPaymentHistory(address user) external view returns (PaymentPoint[] memory) {
        uint256[] memory tokenIds = userPoints[user];
        PaymentPoint[] memory history = new PaymentPoint[](tokenIds.length);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            history[i] = paymentPoints[tokenIds[i]];
        }
        
        return history;
    }

    function getCreditScore(address user) external view returns (uint256 score, string memory rating) {
        score = userScores[user];
        
        if (score >= 1000) {
            rating = "Excellent";
        } else if (score >= 750) {
            rating = "Very Good";
        } else if (score >= 500) {
            rating = "Good";
        } else if (score >= 300) {
            rating = "Fair";
        } else {
            rating = "Poor";
        }
    }

    function setSubscriptionFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Invalid factory address");
        subscriptionFactory = _factory;
    }

    function authorizeMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    function updateScoreParameters(
        uint256 _baseScore,
        uint256 _bonusMultiplier,
        uint256 _maxConsecutiveBonus
    ) external onlyOwner {
        require(_baseScore > 0, "Base score too low");
        require(_bonusMultiplier >= 100, "Bonus multiplier too low");
        require(_maxConsecutiveBonus >= _baseScore, "Max bonus too low");
        
        baseScore = _baseScore;
        bonusMultiplier = _bonusMultiplier;
        maxConsecutiveBonus = _maxConsecutiveBonus;
    }

    function burnExpiredPoints(uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(_exists(tokenId), "Token does not exist");
            
            PaymentPoint memory point = paymentPoints[tokenId];
            // Only burn points older than 2 years
            require(block.timestamp - point.timestamp > 730 days, "Point not expired");
            
            address user = point.user;
            userScores[user] -= point.score;
            
            // Remove from user points array
            uint256[] storage userTokens = userPoints[user];
            for (uint256 j = 0; j < userTokens.length; j++) {
                if (userTokens[j] == tokenId) {
                    userTokens[j] = userTokens[userTokens.length - 1];
                    userTokens.pop();
                    break;
                }
            }
            
            delete paymentPoints[tokenId];
            _burn(tokenId);
        }
    }

    // Override transfer functions for soulbound tokens
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        if (from != address(0) && to != address(0)) {
            require(!paymentPoints[tokenId].soulbound, "Soulbound token cannot be transferred");
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(IERC165, ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        PaymentPoint memory point = paymentPoints[tokenId];
        
        // Return metadata URL or construct on-chain metadata
        if (bytes(point.metadata).length > 0) {
            return point.metadata;
        }
        
        // Construct basic metadata
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _encodeBase64(bytes(abi.encodePacked(
                '{"name":"Payment Point #', _toString(tokenId), '",',
                '"description":"Payment Point NFT for subscription payments",',
                '"attributes":[',
                '{"trait_type":"Score","value":', _toString(point.score), '},',
                '{"trait_type":"Amount","value":', _toString(point.amount), '},',
                '{"trait_type":"Soulbound","value":"', point.soulbound ? 'true' : 'false', '"}',
                ']}'
            )))
        ));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _encodeBase64(bytes memory data) internal pure returns (string memory) {
        // Simple base64 encoding - in production use a library
        return ""; // Placeholder
    }
}