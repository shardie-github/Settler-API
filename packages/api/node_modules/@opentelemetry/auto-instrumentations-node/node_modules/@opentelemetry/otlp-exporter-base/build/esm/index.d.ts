export * from './platform';
export { OTLPExporterBase } from './OTLPExporterBase';
export { OTLPExporterError, OTLPExporterConfigBase, ExportServiceError, } from './types';
export { validateAndNormalizeHeaders } from './util';
export { ExportResponse, ExportResponseFailure, ExportResponseSuccess, ExportResponseRetryable, } from './export-response';
export { IExporterTransport } from './exporter-transport';
export { OtlpSharedConfiguration, mergeOtlpSharedConfigurationWithDefaults, getSharedConfigurationDefaults, } from './configuration/shared-configuration';
export { getSharedConfigurationFromEnvironment } from './configuration/shared-env-configuration';
//# sourceMappingURL=index.d.ts.map