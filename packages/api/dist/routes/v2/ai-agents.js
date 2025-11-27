"use strict";
/**
 * AI Agents API Routes
 *
 * REST API for managing and interacting with AI agents
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orchestrator_1 = require("../../services/ai-agents/orchestrator");
const infrastructure_optimizer_1 = require("../../services/ai-agents/infrastructure-optimizer");
const anomaly_detector_1 = require("../../services/ai-agents/anomaly-detector");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
// Initialize agents
const infrastructureOptimizer = new infrastructure_optimizer_1.InfrastructureOptimizerAgent({});
const anomalyDetector = new anomaly_detector_1.AnomalyDetectorAgent({});
orchestrator_1.agentOrchestrator.registerAgent(infrastructureOptimizer);
orchestrator_1.agentOrchestrator.registerAgent(anomalyDetector);
// Initialize all agents on startup
orchestrator_1.agentOrchestrator.initializeAll().catch(console.error);
/**
 * GET /api/v2/ai-agents
 * List all agents
 */
router.get('/', async (req, res) => {
    try {
        const agents = orchestrator_1.agentOrchestrator.listAgents();
        res.json({
            data: agents,
            count: agents.length,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to list agents', 500);
    }
});
/**
 * GET /api/v2/ai-agents/:agentId
 * Get agent details
 */
router.get('/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = orchestrator_1.agentOrchestrator.getAgent(agentId);
        if (!agent) {
            return res.status(404).json({
                error: 'Agent not found',
                message: `Agent ${agentId} not found`,
            });
        }
        const status = await agent.getStatus();
        res.json({
            data: {
                id: agent.id,
                name: agent.name,
                type: agent.type,
                status,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get agent', 500);
    }
});
/**
 * POST /api/v2/ai-agents/:agentId/execute
 * Execute an agent action
 */
router.post('/:agentId/execute', async (req, res) => {
    try {
        const { agentId } = req.params;
        const { action, params } = req.body;
        const response = await orchestrator_1.agentOrchestrator.execute({
            agentId,
            action,
            params: params || {},
        });
        res.json({
            data: response,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to execute agent action', 400);
    }
});
/**
 * POST /api/v2/ai-agents/:agentId/enable
 * Enable an agent
 */
router.post('/:agentId/enable', async (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = orchestrator_1.agentOrchestrator.getAgent(agentId);
        if (!agent) {
            return res.status(404).json({
                error: 'Agent not found',
                message: `Agent ${agentId} not found`,
            });
        }
        agent.enable();
        res.json({
            data: {
                agentId,
                enabled: true,
            },
            message: 'Agent enabled successfully',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to enable agent', 400);
    }
});
/**
 * POST /api/v2/ai-agents/:agentId/disable
 * Disable an agent
 */
router.post('/:agentId/disable', async (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = orchestrator_1.agentOrchestrator.getAgent(agentId);
        if (!agent) {
            return res.status(404).json({
                error: 'Agent not found',
                message: `Agent ${agentId} not found`,
            });
        }
        agent.disable();
        res.json({
            data: {
                agentId,
                enabled: false,
            },
            message: 'Agent disabled successfully',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to disable agent', 400);
    }
});
/**
 * GET /api/v2/ai-agents/stats
 * Get orchestrator stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = orchestrator_1.agentOrchestrator.getStats();
        res.json({
            data: stats,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get stats', 500);
    }
});
exports.default = router;
//# sourceMappingURL=ai-agents.js.map