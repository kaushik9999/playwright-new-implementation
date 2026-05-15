import * as CryptoJS from 'crypto-js';

// Decrypts an AES-encrypted string using the key supplied via the `CRYPTO_KEY` environment variable. The legacy framework hardcoded the key in source; that is a security anti-pattern and is no longer supported.
export function decrypt(ciphertext: string): string {
  const key = process.env.CRYPTO_KEY;
  if (!key) {
    throw new Error(`CRYPTO_KEY is not set; cannot decrypt secret.`);
  }
  const plain = CryptoJS.AES.decrypt(ciphertext, key).toString(
    CryptoJS.enc.Utf8,
  );
  if (!plain) {
    throw new Error(`Failed to decrypt: check CRYPTO_KEY and ciphertext.`);
  }
  return plain;
}

// Helper for generating ciphertext locally. Not used by tests — invoke via `npm run crypto:encrypt` (see package.json).
export function encrypt(plaintext: string): string {
  const key = process.env.CRYPTO_KEY;
  if (!key) {
    throw new Error(`CRYPTO_KEY is not set; cannot encrypt secret.`);
  }
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}
