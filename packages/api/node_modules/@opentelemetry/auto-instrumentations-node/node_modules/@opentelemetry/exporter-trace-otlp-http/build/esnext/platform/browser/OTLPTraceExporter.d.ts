import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPExporterConfigBase, OTLPExporterBrowserBase } from '@opentelemetry/otlp-exporter-base';
import { IExportTraceServiceResponse } from '@opentelemetry/otlp-transformer';
/**
 * Collector Trace Exporter for Web
 */
export declare class OTLPTraceExporter extends OTLPExporterBrowserBase<ReadableSpan, IExportTraceServiceResponse> implements SpanExporter {
    constructor(config?: OTLPExporterConfigBase);
}
//# sourceMappingURL=OTLPTraceExporter.d.ts.map