// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/IUserAgent.sol";

contract UserAgent is IUserAgent, Ownable, EIP712, Initializable {
    using ECDSA for bytes32;

    bytes4 constant internal MAGICVALUE = 0x1626ba7e;

    mapping(address => bool) public authorizedAgents;
    mapping(address => uint256) public agentNonces;

    event AgentAuthorized(address indexed agent, bool authorized);
    event SignatureValidated(bytes32 indexed hash, address indexed signer);
    event AgentActionExecuted(address indexed agent, address indexed target, bool success);

    modifier onlyOwnerOrAgent() {
        require(owner() == _msgSender() || authorizedAgents[_msgSender()], "Unauthorized");
        _;
    }

    constructor() EIP712("PayGuard UserAgent", "1") {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        string memory _name,
        string memory _version
    ) external initializer {
        _transferOwnership(_owner);
        // EIP712 domain is already set in constructor via inheritance
    }

    function authorizeAgent(address agent, bool authorized) external override onlyOwner {
        require(agent != address(0), "Invalid agent address");
        authorizedAgents[agent] = authorized;
        if (!authorized) {
            agentNonces[agent] = 0; // Reset nonce when deauthorizing
        }
        emit AgentAuthorized(agent, authorized);
    }

    function isAuthorizedAgent(address agent) external view override returns (bool) {
        return authorizedAgents[agent];
    }

    function isValidSignature(bytes32 hash, bytes memory signature) 
        external 
        view 
        override 
        returns (bytes4) 
    {
        address signer = hash.recover(signature);
        
        if (signer == owner() || authorizedAgents[signer]) {
            return MAGICVALUE;
        }
        
        return 0xffffffff;
    }

    function validateAgentSignature(
        bytes32 structHash,
        address expectedAgent,
        uint256 nonce,
        bytes memory signature
    ) external view returns (bool) {
        require(authorizedAgents[expectedAgent], "Agent not authorized");
        require(agentNonces[expectedAgent] == nonce, "Invalid nonce");
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        return signer == expectedAgent;
    }

    function executeAgentAction(
        bytes32 structHash,
        uint256 nonce,
        bytes memory signature,
        address target,
        bytes memory data
    ) external override returns (bool success, bytes memory result) {
        bytes32 hash = _hashTypedDataV4(structHash);
        address agent = hash.recover(signature);
        
        require(authorizedAgents[agent], "Agent not authorized");
        require(agentNonces[agent] == nonce, "Invalid nonce");
        require(target != address(0), "Invalid target address");
        
        agentNonces[agent]++;
        
        (success, result) = target.call(data);
        
        emit AgentActionExecuted(agent, target, success);
    }

    function getAgentNonce(address agent) external view returns (uint256) {
        return agentNonces[agent];
    }

    function batchAuthorizeAgents(address[] calldata agents, bool[] calldata authorized) external onlyOwner {
        require(agents.length == authorized.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < agents.length; i++) {
            require(agents[i] != address(0), "Invalid agent address");
            authorizedAgents[agents[i]] = authorized[i];
            if (!authorized[i]) {
                agentNonces[agents[i]] = 0;
            }
            emit AgentAuthorized(agents[i], authorized[i]);
        }
    }

    function emergencyRevoke(address agent) external onlyOwner {
        require(authorizedAgents[agent], "Agent not authorized");
        authorizedAgents[agent] = false;
        agentNonces[agent] = 0;
        emit AgentAuthorized(agent, false);
    }
}