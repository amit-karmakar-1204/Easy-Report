/**
 * Cryptographic security helpers using native Web Crypto API.
 * Compatible with modern browsers, Node.js (v18+), and edge runtimes.
 */

export function generateSalt(length: number = 16): string {
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }
  // Fallback for Node.js / SSR
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length * 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  const combined = `${salt}:${password}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);

  const cryptoObj =
    typeof window !== "undefined" && window.crypto
      ? window.crypto
      : (globalThis.crypto as Crypto);

  if (!cryptoObj || !cryptoObj.subtle) {
    // Basic fallback hash for non-crypto environments
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `fallback_${Math.abs(hash).toString(16)}`;
  }

  const hashBuffer = await cryptoObj.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return computedHash === expectedHash;
}
