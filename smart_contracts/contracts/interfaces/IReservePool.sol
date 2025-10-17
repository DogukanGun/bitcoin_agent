// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IReservePool {
    struct UnderwriterInfo {
        uint256 stakeAmount;
        uint256 utilizationCap;
        uint256 currentUtilization;
        bool active;
        uint256 rewardAccumulated;
    }

    function addStake(address token, uint256 amount, uint256 utilizationCap) external;
    function removeStake(address token, uint256 amount) external;
    function grantCreditLine(address user, address token, uint256 amount) external;
    function payClaim(
        address subscription,
        address provider,
        address token,
        uint256 amount,
        bytes calldata claimProof,
        bytes calldata platformSig
    ) external returns (bool);
    function repayFromUser(
        address user,
        address token,
        uint256 amount,
        uint256 fee
    ) external returns (bool);
    function getUnderwritingCapacity(address user, address token) external view returns (uint256);
    function getUnderwriterInfo(address token, address underwriter) external view returns (UnderwriterInfo memory);
}