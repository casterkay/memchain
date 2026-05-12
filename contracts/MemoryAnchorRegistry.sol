// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MemoryAnchorRegistry {
    struct MemoryAnchor {
        bytes32 agentId;
        bytes32 commitHash;
        bytes32 parentCommitHash;
        bytes32 metadataHash;
        bytes32 artifactHash;
        string ipfsCid;
        uint64 timestamp;
        address recorder;
    }

    event AgentRegistered(bytes32 indexed agentId, string metadataURI, address indexed owner);

    event MemoryAnchored(
        bytes32 indexed agentId,
        bytes32 indexed commitHash,
        bytes32 indexed parentCommitHash,
        bytes32 metadataHash,
        bytes32 artifactHash,
        string ipfsCid,
        address recorder
    );

    mapping(bytes32 => string) public agentMetadataURI;
    mapping(bytes32 => address) public agentOwner;
    mapping(bytes32 => bytes32) private latest;
    mapping(bytes32 => mapping(bytes32 => MemoryAnchor)) private anchors;

    function registerAgent(bytes32 agentId, string calldata metadataURI) external {
        require(agentId != bytes32(0), "agent required");
        require(bytes(agentMetadataURI[agentId]).length == 0, "agent exists");
        agentMetadataURI[agentId] = metadataURI;
        agentOwner[agentId] = msg.sender;
        emit AgentRegistered(agentId, metadataURI, msg.sender);
    }

    function anchorMemory(
        bytes32 agentId,
        bytes32 commitHash,
        bytes32 parentCommitHash,
        bytes32 metadataHash,
        bytes32 artifactHash,
        string calldata ipfsCid
    ) external {
        require(agentId != bytes32(0), "agent required");
        require(commitHash != bytes32(0), "commit required");
        require(bytes(agentMetadataURI[agentId]).length != 0, "agent missing");
        require(msg.sender == agentOwner[agentId], "not agent owner");
        require(anchors[agentId][commitHash].commitHash == bytes32(0), "anchor exists");

        anchors[agentId][commitHash] = MemoryAnchor({
            agentId: agentId,
            commitHash: commitHash,
            parentCommitHash: parentCommitHash,
            metadataHash: metadataHash,
            artifactHash: artifactHash,
            ipfsCid: ipfsCid,
            timestamp: uint64(block.timestamp),
            recorder: msg.sender
        });
        latest[agentId] = commitHash;

        emit MemoryAnchored(agentId, commitHash, parentCommitHash, metadataHash, artifactHash, ipfsCid, msg.sender);
    }

    function latestMemory(bytes32 agentId) external view returns (bytes32) {
        return latest[agentId];
    }

    function getMemory(bytes32 agentId, bytes32 commitHash) external view returns (MemoryAnchor memory) {
        MemoryAnchor memory anchor = anchors[agentId][commitHash];
        require(anchor.commitHash != bytes32(0), "anchor missing");
        return anchor;
    }
}
