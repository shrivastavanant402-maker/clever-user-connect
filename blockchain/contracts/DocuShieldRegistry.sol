// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocuShieldRegistry {
    struct DocumentRecord {
        bytes32 documentHash;
        address issuer;
        uint256 registeredAt;
        uint256 version;
        bool active;
        bool exists;
    }

    mapping(bytes32 => DocumentRecord) public documents;

    event DocumentRegistered(bytes32 indexed documentId, bytes32 indexed documentHash, address indexed issuer, uint256 timestamp);
    event DocumentRevoked(bytes32 indexed documentId, address indexed issuer, string reason, uint256 timestamp);
    event DocumentVersionCreated(bytes32 indexed documentId, bytes32 indexed oldHash, bytes32 indexed newHash, uint256 version, uint256 timestamp);

    function registerDocument(bytes32 documentId, bytes32 documentHash) external {
        require(!documents[documentId].exists, "Document ID already registered");

        documents[documentId] = DocumentRecord({
            documentHash: documentHash,
            issuer: msg.sender,
            registeredAt: block.timestamp,
            version: 1,
            active: true,
            exists: true
        });

        emit DocumentRegistered(documentId, documentHash, msg.sender, block.timestamp);
    }

    function getDocumentRecord(bytes32 documentId) external view returns (DocumentRecord memory) {
        require(documents[documentId].exists, "Document does not exist");
        return documents[documentId];
    }

    function verifyDocument(bytes32 documentId, bytes32 suppliedHash) external view returns (bool isActive, bool hashMatches) {
        if (!documents[documentId].exists) {
            return (false, false);
        }
        DocumentRecord memory doc = documents[documentId];
        isActive = doc.active;
        hashMatches = (doc.documentHash == suppliedHash);
    }

    function revokeDocument(bytes32 documentId, string memory reason) external {
        require(documents[documentId].exists, "Document does not exist");
        require(documents[documentId].issuer == msg.sender, "Only issuer can revoke");
        require(documents[documentId].active, "Document already revoked");

        documents[documentId].active = false;
        emit DocumentRevoked(documentId, msg.sender, reason, block.timestamp);
    }

    function createVersion(bytes32 documentId, bytes32 newHash) external {
        require(documents[documentId].exists, "Document does not exist");
        require(documents[documentId].issuer == msg.sender, "Only issuer can create version");

        bytes32 oldHash = documents[documentId].documentHash;
        documents[documentId].documentHash = newHash;
        documents[documentId].version += 1;
        documents[documentId].active = true;

        emit DocumentVersionCreated(documentId, oldHash, newHash, documents[documentId].version, block.timestamp);
    }
}
