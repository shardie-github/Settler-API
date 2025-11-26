/**
 * Encryption Service
 * Handles encryption/decryption of sensitive data at rest using AES-256-GCM
 */

import crypto from 'crypto';
import { config } from '../../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  if (!config.encryption.key) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  // Derive a 32-byte key from the encryption key
  return crypto
    .createHash('sha256')
    .update(config.encryption.key)
    .digest();
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Combine IV + tag + encrypted data
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
