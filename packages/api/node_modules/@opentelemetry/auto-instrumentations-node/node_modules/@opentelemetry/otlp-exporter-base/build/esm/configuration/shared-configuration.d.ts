/**
 * Configuration shared across all OTLP exporters
 *
 * Implementation note: anything added here MUST be
 * - platform-agnostic
 * - signal-agnostic
 * - transport-agnostic
 */
export interface OtlpSharedConfiguration {
    timeoutMillis: number;
    concurrencyLimit: number;
    compression: 'gzip' | 'none';
}
export declare function validateTimeoutMillis(timeoutMillis: number): number;
/**
 * @param userProvidedConfiguration  Configuration options provided by the user in code.
 * @param fallbackConfiguration Fallback to use when the {@link userProvidedConfiguration} does not specify an option.
 * @param defaultConfiguration The defaults as defined by the exporter specification
 */
export declare function mergeOtlpSharedConfigurationWithDefaults(userProvidedConfiguration: Partial<OtlpSharedConfiguration>, fallbackConfiguration: Partial<OtlpSharedConfiguration>, defaultConfiguration: OtlpSharedConfiguration): OtlpSharedConfiguration;
export declare function getSharedConfigurationDefaults(): OtlpSharedConfiguration;
//# sourceMappingURL=shared-configuration.d.ts.map