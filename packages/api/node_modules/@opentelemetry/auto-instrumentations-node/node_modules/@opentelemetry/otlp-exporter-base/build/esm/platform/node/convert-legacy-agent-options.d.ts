/// <reference types="node" />
import { OTLPExporterNodeConfigBase } from './types';
import type * as http from 'http';
import type * as https from 'https';
/**
 * Replicates old config behavior where there's two ways to set keepAlive.
 * This function sets keepAlive in AgentOptions if it is defined. In the future, we will remove
 * this duplicate to only allow setting keepAlive in AgentOptions.
 * @param config
 */
export declare function convertLegacyAgentOptions(config: OTLPExporterNodeConfigBase): http.AgentOptions | https.AgentOptions;
//# sourceMappingURL=convert-legacy-agent-options.d.ts.map