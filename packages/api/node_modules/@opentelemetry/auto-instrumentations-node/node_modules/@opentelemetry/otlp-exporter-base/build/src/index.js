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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedConfigurationFromEnvironment = exports.getSharedConfigurationDefaults = exports.mergeOtlpSharedConfigurationWithDefaults = exports.validateAndNormalizeHeaders = exports.OTLPExporterError = exports.OTLPExporterBase = void 0;
/* eslint no-restricted-syntax: ["warn", "ExportAllDeclaration"] --
 * TODO: Replace export * with named exports before next major version
 */
__exportStar(require("./platform"), exports);
var OTLPExporterBase_1 = require("./OTLPExporterBase");
Object.defineProperty(exports, "OTLPExporterBase", { enumerable: true, get: function () { return OTLPExporterBase_1.OTLPExporterBase; } });
var types_1 = require("./types");
Object.defineProperty(exports, "OTLPExporterError", { enumerable: true, get: function () { return types_1.OTLPExporterError; } });
var util_1 = require("./util");
Object.defineProperty(exports, "validateAndNormalizeHeaders", { enumerable: true, get: function () { return util_1.validateAndNormalizeHeaders; } });
var shared_configuration_1 = require("./configuration/shared-configuration");
Object.defineProperty(exports, "mergeOtlpSharedConfigurationWithDefaults", { enumerable: true, get: function () { return shared_configuration_1.mergeOtlpSharedConfigurationWithDefaults; } });
Object.defineProperty(exports, "getSharedConfigurationDefaults", { enumerable: true, get: function () { return shared_configuration_1.getSharedConfigurationDefaults; } });
var shared_env_configuration_1 = require("./configuration/shared-env-configuration");
Object.defineProperty(exports, "getSharedConfigurationFromEnvironment", { enumerable: true, get: function () { return shared_env_configuration_1.getSharedConfigurationFromEnvironment; } });
//# sourceMappingURL=index.js.map