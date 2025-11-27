"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLegacyAgentOptions = void 0;
/**
 * Replicates old config behavior where there's two ways to set keepAlive.
 * This function sets keepAlive in AgentOptions if it is defined. In the future, we will remove
 * this duplicate to only allow setting keepAlive in AgentOptions.
 * @param config
 */
function convertLegacyAgentOptions(config) {
    var _a;
    // populate keepAlive for use with new settings
    if ((config === null || config === void 0 ? void 0 : config.keepAlive) != null) {
        if (config.httpAgentOptions != null) {
            if (config.httpAgentOptions.keepAlive == null) {
                // specific setting is not set, populate with non-specific setting.
                config.httpAgentOptions.keepAlive = config.keepAlive;
            }
            // do nothing, use specific setting otherwise
        }
        else {
            // populate specific option if AgentOptions does not exist.
            config.httpAgentOptions = {
                keepAlive: config.keepAlive,
            };
        }
    }
    return (_a = config.httpAgentOptions) !== null && _a !== void 0 ? _a : { keepAlive: true };
}
exports.convertLegacyAgentOptions = convertLegacyAgentOptions;
//# sourceMappingURL=convert-legacy-agent-options.js.map