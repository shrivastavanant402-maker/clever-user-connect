import { expect } from "chai";
import { ethers } from "hardhat";
import { DocuShieldRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DocuShieldRegistry", function () {
  let registry: DocuShieldRegistry;
  let owner: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  const DOC_ID_1 = ethers.id("doc1");
  const HASH_1 = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const HASH_2 = "0x2222222222222222222222222222222222222222222222222222222222222222";
  const HASH_MODIFIED = "0x3333333333333333333333333333333333333333333333333333333333333333";

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const DocuShieldRegistryFactory = await ethers.getContractFactory("DocuShieldRegistry");
    registry = await DocuShieldRegistryFactory.deploy();
  });

  it("1. A new document can be registered", async function () {
    await expect(registry.registerDocument(DOC_ID_1, HASH_1)).to.not.be.reverted;
  });

  it("2. Registration records the correct issuer address", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    const record = await registry.getDocumentRecord(DOC_ID_1);
    expect(record.issuer).to.equal(owner.address);
  });

  it("3. Registration records the correct hash", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    const record = await registry.getDocumentRecord(DOC_ID_1);
    expect(record.documentHash).to.equal(HASH_1);
  });

  it("4. Duplicate document IDs are rejected", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    await expect(registry.registerDocument(DOC_ID_1, HASH_2)).to.be.revertedWith("Document ID already registered");
  });

  it("5. verifyDocument() returns true for the correct hash", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    const [isActive, hashMatches] = await registry.verifyDocument(DOC_ID_1, HASH_1);
    expect(isActive).to.be.true;
    expect(hashMatches).to.be.true;
  });

  it("6. verifyDocument() returns false for a modified hash", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    const [isActive, hashMatches] = await registry.verifyDocument(DOC_ID_1, HASH_MODIFIED);
    expect(isActive).to.be.true;
    expect(hashMatches).to.be.false;
  });

  it("7. An issuer can revoke their own document", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    await expect(registry.revokeDocument(DOC_ID_1, "Lost")).to.not.be.reverted;
    const record = await registry.getDocumentRecord(DOC_ID_1);
    expect(record.active).to.be.false;
  });

  it("8. Another wallet cannot revoke someone else's document", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    await expect(registry.connect(otherAccount).revokeDocument(DOC_ID_1, "Lost"))
      .to.be.revertedWith("Only issuer can revoke");
  });

  it("9. A revoked document is no longer considered valid", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    await registry.revokeDocument(DOC_ID_1, "Lost");
    const [isActive, hashMatches] = await registry.verifyDocument(DOC_ID_1, HASH_1);
    expect(isActive).to.be.false;
    expect(hashMatches).to.be.true; // Hash matches but it's not active
  });

  it("10. A new version increments the version number", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    await registry.createVersion(DOC_ID_1, HASH_2);
    const record = await registry.getDocumentRecord(DOC_ID_1);
    expect(record.version).to.equal(2);
  });

  it("11. The previous version is no longer active (hash is overwritten)", async function () {
    await registry.registerDocument(DOC_ID_1, HASH_1);
    await registry.createVersion(DOC_ID_1, HASH_2);
    const [isActive, hashMatches] = await registry.verifyDocument(DOC_ID_1, HASH_1);
    expect(hashMatches).to.be.false; // The old hash doesn't match anymore
    const [, newHashMatches] = await registry.verifyDocument(DOC_ID_1, HASH_2);
    expect(newHashMatches).to.be.true;
  });

  it("12. Events are emitted correctly", async function () {
    // DocumentRegistered
    await expect(registry.registerDocument(DOC_ID_1, HASH_1))
      .to.emit(registry, "DocumentRegistered")
      .withArgs(DOC_ID_1, HASH_1, owner.address, (val: any) => val > 0);

    // DocumentVersionCreated
    await expect(registry.createVersion(DOC_ID_1, HASH_2))
      .to.emit(registry, "DocumentVersionCreated")
      .withArgs(DOC_ID_1, HASH_1, HASH_2, 2, (val: any) => val > 0);

    // DocumentRevoked
    await expect(registry.revokeDocument(DOC_ID_1, "Compromised"))
      .to.emit(registry, "DocumentRevoked")
      .withArgs(DOC_ID_1, owner.address, "Compromised", (val: any) => val > 0);
  });
});
