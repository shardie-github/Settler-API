import { ExportResult, BindOnceFuture } from '@opentelemetry/core';
import { OTLPExporterError, OTLPExporterConfigBase } from './types';
/**
 * Collector Exporter abstract base class
 */
export declare abstract class OTLPExporterBase<T extends OTLPExporterConfigBase, ExportItem> {
    protected _concurrencyLimit: number;
    protected _sendingPromises: Promise<unknown>[];
    protected _shutdownOnce: BindOnceFuture<void>;
    /**
     * @param config
     */
    constructor(config?: T);
    /**
     * Export items.
     * @param items
     * @param resultCallback
     */
    export(items: ExportItem[], resultCallback: (result: ExportResult) => void): void;
    private _export;
    /**
     * Shutdown the exporter.
     */
    shutdown(): Promise<void>;
    /**
     * Exports any pending spans in the exporter
     */
    forceFlush(): Promise<void>;
    /**
     * Called by _shutdownOnce with BindOnceFuture
     */
    private _shutdown;
    abstract onShutdown(): void;
    abstract send(items: ExportItem[], onSuccess: () => void, onError: (error: OTLPExporterError) => void): void;
}
//# sourceMappingURL=OTLPExporterBase.d.ts.map