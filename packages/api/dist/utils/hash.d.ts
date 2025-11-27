export declare function hashApiKey(apiKey: string): Promise<string>;
export declare function verifyApiKey(apiKey: string, hash: string): Promise<boolean>;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export declare function generateApiKey(): {
    key: string;
    prefix: string;
};
//# sourceMappingURL=hash.d.ts.map