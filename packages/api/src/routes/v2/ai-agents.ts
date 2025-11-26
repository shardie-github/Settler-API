/**
 * AI Agents API Routes
 * 
 * REST API for managing and interacting with AI agents
 */

import { Router, Request, Response } from 'express';
import { agentOrchestrator } from '../../services/ai-agents/orchestrator';
import { InfrastructureOptimizerAgent } from '../../services/ai-agents/infrastructure-optimizer';
import { AnomalyDetectorAgent } from '../../services/ai-agents/anomaly-detector';

const router = Router();

// Initialize agents
const infrastructureOptimizer = new InfrastructureOptimizerAgent({});
const anomalyDetector = new AnomalyDetectorAgent({});

agentOrchestrator.registerAgent(infrastructureOptimizer);
agentOrchestrator.registerAgent(anomalyDetector);

// Initialize all agents on startup
agentOrchestrator.initializeAll().catch(console.error);

/**
 * GET /api/v2/ai-agents
 * List all agents
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const agents = agentOrchestrator.listAgents();
    res.json({
      data: agents,
      count: agents.length,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list agents',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/ai-agents/:agentId
 * Get agent details
 */
router.get('/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = agentOrchestrator.getAgent(agentId);

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
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get agent',
      message: error.message,
    });
  }
});

/**
 * POST /api/v2/ai-agents/:agentId/execute
 * Execute an agent action
 */
router.post('/:agentId/execute', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { action, params } = req.body;

    const response = await agentOrchestrator.execute({
      agentId,
      action,
      params: params || {},
    });

    res.json({
      data: response,
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to execute agent action',
      message: error.message,
    });
  }
});

/**
 * POST /api/v2/ai-agents/:agentId/enable
 * Enable an agent
 */
router.post('/:agentId/enable', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = agentOrchestrator.getAgent(agentId);

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
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to enable agent',
      message: error.message,
    });
  }
});

/**
 * POST /api/v2/ai-agents/:agentId/disable
 * Disable an agent
 */
router.post('/:agentId/disable', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = agentOrchestrator.getAgent(agentId);

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
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to disable agent',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/ai-agents/stats
 * Get orchestrator stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = agentOrchestrator.getStats();
    res.json({
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

export default router;
