import { OTLPExporterBase } from '../../OTLPExporterBase';
import { OTLPExporterConfigBase, OTLPExporterError } from '../../types';
import { ISerializer } from '@opentelemetry/otlp-transformer';
/**
 * Collector Metric Exporter abstract base class
 */
export declare abstract class OTLPExporterBrowserBase<ExportItem, ServiceResponse> extends OTLPExporterBase<OTLPExporterConfigBase, ExportItem> {
    private _serializer;
    private _transport;
    private _timeoutMillis;
    /**
     * @param config
     * @param serializer
     * @param requiredHeaders
     * @param signalResourcePath
     */
    constructor(config: OTLPExporterConfigBase | undefined, serializer: ISerializer<ExportItem[], ServiceResponse>, requiredHeaders: Record<string, string>, signalResourcePath: string);
    onShutdown(): void;
    send(objects: ExportItem[], onSuccess: () => void, onError: (error: OTLPExporterError) => void): void;
}
//# sourceMappingURL=OTLPExporterBrowserBase.d.ts.map