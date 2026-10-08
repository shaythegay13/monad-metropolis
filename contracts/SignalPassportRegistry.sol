// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

interface IAgentWalletRegistry {
    function getAgentWallet(uint256 agentId) external view returns (address);
}

/// @notice Anchors existing SHA-256 payload digests; does not judge evidence or trust.
contract SignalPassportRegistry {
    IAgentWalletRegistry public immutable identityRegistry;
    struct Publication {
        bytes32 profileHash;
        string contentUri;
        address publisher;
        uint256 publishedAt;
        uint256 blockNumber;
    }
    mapping(uint256 => uint256) public latestVersion;
    mapping(uint256 => mapping(uint256 => Publication)) private publications;
    error InvalidIdentityRegistry();
    error UnauthorizedPublisher();
    error InvalidVersion();
    error ZeroProfileHash();
    event PassportPublished(uint256 indexed agentId, uint256 indexed version,
        bytes32 indexed profileHash, string contentUri, address publisher);

    constructor(address identityRegistry_) {
        if (identityRegistry_.code.length == 0) revert InvalidIdentityRegistry();
        identityRegistry = IAgentWalletRegistry(identityRegistry_);
    }
    function publishPassport(uint256 agentId, bytes32 profileHash, string calldata contentUri, uint256 version) external {
        // A failed/malformed dependency read reverts. Never substitute owner or operator.
        address wallet = identityRegistry.getAgentWallet(agentId);
        if (wallet == address(0) || msg.sender != wallet) revert UnauthorizedPublisher();
        if (profileHash == bytes32(0)) revert ZeroProfileHash();
        if (version == 0 || version != latestVersion[agentId] + 1) revert InvalidVersion();
        publications[agentId][version] = Publication(profileHash, contentUri, msg.sender, block.timestamp, block.number);
        latestVersion[agentId] = version;
        emit PassportPublished(agentId, version, profileHash, contentUri, msg.sender);
    }
    function getPassportVersion(uint256 agentId, uint256 version) external view returns (Publication memory) {
        return publications[agentId][version];
    }
    function getLatestPassport(uint256 agentId) external view returns (uint256 version, Publication memory publication) {
        version = latestVersion[agentId];
        publication = publications[agentId][version];
    }
    function verifyPassport(uint256 agentId, uint256 version, bytes32 profileHash) external view returns (bool) {
        return profileHash != bytes32(0) && publications[agentId][version].profileHash == profileHash;
    }
}
