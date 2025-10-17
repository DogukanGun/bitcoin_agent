// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IPaymentPointNFT is IERC721 {
    struct PaymentPoint {
        address user;
        address subscription;
        uint256 amount;
        uint256 timestamp;
        uint256 score;
        string metadata;
        bool soulbound;
    }

    function mintPaymentPoint(
        address user,
        address subscription,
        uint256 amount,
        string memory metadata,
        bool soulbound
    ) external returns (uint256);
    
    function getUserScore(address user) external view returns (uint256);
    function getUserPoints(address user) external view returns (uint256[] memory);
    function getPaymentPoint(uint256 tokenId) external view returns (PaymentPoint memory);
}