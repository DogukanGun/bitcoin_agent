// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISubscriptionFactory {
    struct PaymentAgreement {
        bytes32 agreementId;
        address user;
        address provider;
        address token;
        uint256 amount;
        uint256 period;
        uint256 startDate;
        uint256 gracePeriod;
        uint256 maxCover;
        uint256 nonce;
    }

    function createUserAgent(address user) external returns (address);
    function createSubscription(
        PaymentAgreement memory agreement,
        bytes memory providerSig,
        bytes memory userSig
    ) external returns (address);
    function getUserSubscriptions(address user) external view returns (address[] memory);
    function getSubscription(bytes32 agreementId) external view returns (address);
}