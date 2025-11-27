/**
 * Encryption Utilities
 * AES-256-GCM authenticated encryption
 * Supports both SecretsManager and direct config access for backward compatibility
 */
/**
 * Encrypt sensitive data
 * Supports both new JSON format and legacy base64 format for backward compatibility
 */
export declare function encrypt(data: string, keyName?: string): string;
/**
 * Decrypt sensitive data
 * Supports both new JSON format and legacy base64 format for backward compatibility
 */
export declare function decrypt(encryptedData: string, keyName?: string): string;
//# sourceMappingURL=encryption.d.ts.map