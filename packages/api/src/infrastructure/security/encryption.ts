/**
 * Encryption Utilities
 * AES-256-GCM authenticated encryption
 */

import crypto from 'crypto';
import { SecretsManager } from './SecretsManager';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data
 */
export function encrypt(data: string, keyName: string = 'ENCRYPTION_KEY'): string {
  const key = SecretsManager.getSecret(keyName);
  if (!key) {
    throw new Error(`Encryption key ${keyName} not found`);
  }

  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32 && keyBuffer.length !== 64) {
    throw new Error('Encryption key must be 32 or 64 bytes (hex encoded)');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer.slice(0, 32), iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  });
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string, keyName: string = 'ENCRYPTION_KEY'): string {
  const key = SecretsManager.getSecret(keyName);
  if (!key) {
    throw new Error(`Encryption key ${keyName} not found`);
  }

  const keyBuffer = Buffer.from(key, 'hex');
  const parsed = JSON.parse(encryptedData);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    keyBuffer.slice(0, 32),
    Buffer.from(parsed.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(parsed.authTag, 'hex'));

  let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
