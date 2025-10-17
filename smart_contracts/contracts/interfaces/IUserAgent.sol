// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUserAgent {
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4);
    function isAuthorizedAgent(address agent) external view returns (bool);
    function authorizeAgent(address agent, bool authorized) external;
    function executeAgentAction(
        bytes32 structHash,
        uint256 nonce,
        bytes memory signature,
        address target,
        bytes memory data
    ) external returns (bool success, bytes memory result);
}