/**
 * Calculates a SHA-256 cryptographic hash of a given ArrayBuffer or Uint8Array.
 * Returns the hash as a lowercase hexadecimal string.
 */
export async function calculateSHA256(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
