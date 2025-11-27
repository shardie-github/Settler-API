/**
 * Secrets Management
 * Zero Trust: No secrets in code or logs
 */
export interface SecretConfig {
    name: string;
    required: boolean;
    validator?: (value: string) => boolean;
    description?: string;
}
export declare class SecretsManager {
    private static secrets;
    /**
     * Validate all required secrets at startup
     */
    static validateSecrets(secretConfigs: SecretConfig[]): void;
    /**
     * Get secret value (never log it)
     */
    static getSecret(name: string): string | undefined;
    /**
     * Check if value looks like a hardcoded secret
     */
    private static isLikelyHardcoded;
    /**
     * Redact secret from logs
     */
    static redactSecret(value: string, secretName: string): string;
    /**
     * Mask sensitive data in objects
     */
    static maskSensitiveFields(obj: any, fields: string[]): any;
}
export declare const REQUIRED_SECRETS: SecretConfig[];
//# sourceMappingURL=SecretsManager.d.ts.map