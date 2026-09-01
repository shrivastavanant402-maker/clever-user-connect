// Re-implementing the function here for the test script because we can't easily import a TS file natively in Node without tsx/ts-node.
async function testSHA256(buffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function runTests() {
  const enc = new TextEncoder();
  
  const inputA = enc.encode("Hello, DocuShield!");
  const inputB = enc.encode("Hello, Docushield!"); // lowercase s

  const hashA1 = await testSHA256(inputA);
  const hashA2 = await testSHA256(inputA);
  const hashB = await testSHA256(inputB);

  console.log("Input A Hash:", hashA1);
  console.log("Input B Hash:", hashB);

  if (hashA1 !== hashA2) throw new Error("Hash is not deterministic!");
  if (hashA1 === hashB) throw new Error("Hashes for different inputs collided!");
  if (hashA1 !== "25bba5ef571d7eb6d95751d382877e68bf5186b24d77cb3725b871c5658eafb0") throw new Error("Hash does not match expected SHA-256 value!");

  console.log("All tests passed! Hash length:", hashA1.length);
}

runTests().catch(console.error);
