/**
 * Password Security Utilities
 * Handles password hashing and verification using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map