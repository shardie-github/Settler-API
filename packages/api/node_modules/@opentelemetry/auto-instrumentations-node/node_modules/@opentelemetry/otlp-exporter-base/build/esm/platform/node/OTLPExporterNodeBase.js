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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { OTLPExporterBase } from '../../OTLPExporterBase';
import { diag } from '@opentelemetry/api';
import { createHttpExporterTransport } from './http-exporter-transport';
import { OTLPExporterError } from '../../types';
import { createRetryingTransport } from '../../retrying-transport';
import { convertLegacyAgentOptions } from './convert-legacy-agent-options';
import { getHttpConfigurationDefaults, mergeOtlpHttpConfigurationWithDefaults, } from '../../configuration/otlp-http-configuration';
import { getHttpConfigurationFromEnvironment } from '../../configuration/otlp-http-env-configuration';
/**
 * Collector Metric Exporter abstract base class
 */
var OTLPExporterNodeBase = /** @class */ (function (_super) {
    __extends(OTLPExporterNodeBase, _super);
    function OTLPExporterNodeBase(config, serializer, requiredHeaders, signalIdentifier, signalResourcePath) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        var actualConfig = mergeOtlpHttpConfigurationWithDefaults({
            url: config.url,
            headers: config.headers,
            concurrencyLimit: config.concurrencyLimit,
            timeoutMillis: config.timeoutMillis,
            compression: config.compression,
        }, getHttpConfigurationFromEnvironment(signalIdentifier, signalResourcePath), getHttpConfigurationDefaults(requiredHeaders, signalResourcePath));
        _this._timeoutMillis = actualConfig.timeoutMillis;
        _this._concurrencyLimit = actualConfig.concurrencyLimit;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (config.metadata) {
            diag.warn('Metadata cannot be set when using http');
        }
        _this._serializer = serializer;
        _this._transport = createRetryingTransport({
            transport: createHttpExporterTransport({
                agentOptions: convertLegacyAgentOptions(config),
                compression: actualConfig.compression,
                headers: actualConfig.headers,
                url: actualConfig.url,
            }),
        });
        return _this;
    }
    OTLPExporterNodeBase.prototype.send = function (objects, onSuccess, onError) {
        var _this = this;
        if (this._shutdownOnce.isCalled) {
            diag.debug('Shutdown already started. Cannot send objects');
            return;
        }
        var data = this._serializer.serializeRequest(objects);
        if (data == null) {
            onError(new Error('Could not serialize message'));
            return;
        }
        var promise = this._transport
            .send(data, this._timeoutMillis)
            .then(function (response) {
            if (response.status === 'success') {
                onSuccess();
            }
            else if (response.status === 'failure' && response.error) {
                onError(response.error);
            }
            else if (response.status === 'retryable') {
                onError(new OTLPExporterError('Export failed with retryable status'));
            }
            else {
                onError(new OTLPExporterError('Export failed with unknown error'));
            }
        }, onError);
        this._sendingPromises.push(promise);
        var popPromise = function () {
            var index = _this._sendingPromises.indexOf(promise);
            _this._sendingPromises.splice(index, 1);
        };
        promise.then(popPromise, popPromise);
    };
    OTLPExporterNodeBase.prototype.onShutdown = function () { };
    return OTLPExporterNodeBase;
}(OTLPExporterBase));
export { OTLPExporterNodeBase };
//# sourceMappingURL=OTLPExporterNodeBase.js.map