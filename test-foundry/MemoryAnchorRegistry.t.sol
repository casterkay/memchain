// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/MemoryAnchorRegistry.sol";

contract MemoryAnchorRegistryTest {
    MemoryAnchorRegistry registry;

    function setUp() public {
        registry = new MemoryAnchorRegistry();
    }

    function testRegisterAndAnchorMemory() public {
        bytes32 agentId = keccak256(bytes("openclaw-demo"));
        bytes32 commitHash = keccak256(bytes("commit-1"));
        bytes32 parentCommitHash = bytes32(0);
        bytes32 metadataHash = keccak256(bytes("metadata"));
        bytes32 artifactHash = keccak256(bytes("artifact"));

        registry.registerAgent(agentId, "ipfs://agent");
        registry.anchorMemory(agentId, commitHash, parentCommitHash, metadataHash, artifactHash, "local:cid");

        MemoryAnchorRegistry.MemoryAnchor memory anchor = registry.getMemory(agentId, commitHash);
        require(anchor.agentId == agentId, "agent mismatch");
        require(anchor.commitHash == commitHash, "commit mismatch");
        require(anchor.parentCommitHash == parentCommitHash, "parent mismatch");
        require(anchor.metadataHash == metadataHash, "metadata mismatch");
        require(anchor.artifactHash == artifactHash, "artifact mismatch");
        require(keccak256(bytes(anchor.ipfsCid)) == keccak256(bytes("local:cid")), "cid mismatch");
        require(anchor.recorder == address(this), "recorder mismatch");
        require(registry.latestMemory(agentId) == commitHash, "latest mismatch");
    }

    function testRejectDuplicateAnchor() public {
        bytes32 agentId = keccak256(bytes("openclaw-demo"));
        bytes32 commitHash = keccak256(bytes("commit-1"));

        registry.registerAgent(agentId, "ipfs://agent");
        registry.anchorMemory(agentId, commitHash, bytes32(0), keccak256(bytes("m")), keccak256(bytes("a")), "local:cid");

        bool failed;
        try registry.anchorMemory(agentId, commitHash, bytes32(0), keccak256(bytes("m")), keccak256(bytes("a")), "local:cid") {
            failed = false;
        } catch {
            failed = true;
        }
        require(failed, "duplicate anchor accepted");
    }
}
