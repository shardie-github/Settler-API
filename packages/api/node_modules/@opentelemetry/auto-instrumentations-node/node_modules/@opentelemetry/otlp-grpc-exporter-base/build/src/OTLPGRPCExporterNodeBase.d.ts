import { OTLPGRPCExporterConfigNode } from './types';
import { OTLPExporterBase, OTLPExporterError } from '@opentelemetry/otlp-exporter-base';
import { ISerializer } from '@opentelemetry/otlp-transformer';
/**
 * OTLP Exporter abstract base class
 */
export declare abstract class OTLPGRPCExporterNodeBase<ExportItem, ServiceResponse> extends OTLPExporterBase<OTLPGRPCExporterConfigNode, ExportItem> {
    private _transport;
    private _serializer;
    private _timeoutMillis;
    constructor(config: OTLPGRPCExporterConfigNode | undefined, serializer: ISerializer<ExportItem[], ServiceResponse>, grpcName: string, grpcPath: string, signalIdentifier: string);
    onShutdown(): void;
    send(objects: ExportItem[], onSuccess: () => void, onError: (error: OTLPExporterError) => void): void;
}
//# sourceMappingURL=OTLPGRPCExporterNodeBase.d.ts.map