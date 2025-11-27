"use strict";
/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTLPExporterNodeBase = void 0;
const OTLPExporterBase_1 = require("../../OTLPExporterBase");
const api_1 = require("@opentelemetry/api");
const http_exporter_transport_1 = require("./http-exporter-transport");
const types_1 = require("../../types");
const retrying_transport_1 = require("../../retrying-transport");
const convert_legacy_agent_options_1 = require("./convert-legacy-agent-options");
const otlp_http_configuration_1 = require("../../configuration/otlp-http-configuration");
const otlp_http_env_configuration_1 = require("../../configuration/otlp-http-env-configuration");
/**
 * Collector Metric Exporter abstract base class
 */
class OTLPExporterNodeBase extends OTLPExporterBase_1.OTLPExporterBase {
    constructor(config = {}, serializer, requiredHeaders, signalIdentifier, signalResourcePath) {
        super(config);
        const actualConfig = (0, otlp_http_configuration_1.mergeOtlpHttpConfigurationWithDefaults)({
            url: config.url,
            headers: config.headers,
            concurrencyLimit: config.concurrencyLimit,
            timeoutMillis: config.timeoutMillis,
            compression: config.compression,
        }, (0, otlp_http_env_configuration_1.getHttpConfigurationFromEnvironment)(signalIdentifier, signalResourcePath), (0, otlp_http_configuration_1.getHttpConfigurationDefaults)(requiredHeaders, signalResourcePath));
        this._timeoutMillis = actualConfig.timeoutMillis;
        this._concurrencyLimit = actualConfig.concurrencyLimit;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (config.metadata) {
            api_1.diag.warn('Metadata cannot be set when using http');
        }
        this._serializer = serializer;
        this._transport = (0, retrying_transport_1.createRetryingTransport)({
            transport: (0, http_exporter_transport_1.createHttpExporterTransport)({
                agentOptions: (0, convert_legacy_agent_options_1.convertLegacyAgentOptions)(config),
                compression: actualConfig.compression,
                headers: actualConfig.headers,
                url: actualConfig.url,
            }),
        });
    }
    send(objects, onSuccess, onError) {
        if (this._shutdownOnce.isCalled) {
            api_1.diag.debug('Shutdown already started. Cannot send objects');
            return;
        }
        const data = this._serializer.serializeRequest(objects);
        if (data == null) {
            onError(new Error('Could not serialize message'));
            return;
        }
        const promise = this._transport
            .send(data, this._timeoutMillis)
            .then(response => {
            if (response.status === 'success') {
                onSuccess();
            }
            else if (response.status === 'failure' && response.error) {
                onError(response.error);
            }
            else if (response.status === 'retryable') {
                onError(new types_1.OTLPExporterError('Export failed with retryable status'));
            }
            else {
                onError(new types_1.OTLPExporterError('Export failed with unknown error'));
            }
        }, onError);
        this._sendingPromises.push(promise);
        const popPromise = () => {
            const index = this._sendingPromises.indexOf(promise);
            this._sendingPromises.splice(index, 1);
        };
        promise.then(popPromise, popPromise);
    }
    onShutdown() { }
}
exports.OTLPExporterNodeBase = OTLPExporterNodeBase;
//# sourceMappingURL=OTLPExporterNodeBase.js.map