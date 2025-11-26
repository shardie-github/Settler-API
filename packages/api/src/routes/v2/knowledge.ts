/**
 * Knowledge Management API Routes
 * 
 * REST API for decision logs and AI knowledge assistant
 */

import { Router, Request, Response } from 'express';
import { decisionLog } from '../../services/knowledge/decision-log';
import { aiKnowledgeAssistant } from '../../services/knowledge/ai-assistant';

const router = Router();

/**
 * POST /api/v2/knowledge/decisions
 * Create a new decision
 */
router.post('/decisions', async (req: Request, res: Response) => {
  try {
    const decision = await decisionLog.createDecision(req.body);

    res.status(201).json({
      data: decision,
      message: 'Decision created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to create decision',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/knowledge/decisions
 * Query decisions
 */
router.get('/decisions', async (req: Request, res: Response) => {
  try {
    const decisions = decisionLog.queryDecisions({
      status: req.query.status as any,
      decisionMaker: req.query.decisionMaker as string,
      tag: req.query.tag as string,
      dateRange: req.query.startDate && req.query.endDate ? {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string),
      } : undefined,
      search: req.query.search as string,
    });

    res.json({
      data: decisions,
      count: decisions.length,
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to query decisions',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/knowledge/decisions/:id
 * Get a decision by ID
 */
router.get('/decisions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decision = decisionLog.getDecision(id);

    if (!decision) {
      return res.status(404).json({
        error: 'Decision not found',
        message: `Decision ${id} not found`,
      });
    }

    const related = decisionLog.getRelatedDecisions(id);

    res.json({
      data: {
        ...decision,
        relatedDecisions: related,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to get decision',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/v2/knowledge/decisions/:id/outcomes
 * Update decision outcomes
 */
router.patch('/decisions/:id/outcomes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { outcome } = req.body;

    if (!outcome) {
      return res.status(400).json({
        error: 'Missing outcome',
      });
    }

    const decision = await decisionLog.updateOutcomes(id, outcome);

    res.json({
      data: decision,
      message: 'Outcome updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to update outcome',
      message: error.message,
    });
  }
});

/**
 * POST /api/v2/knowledge/assistant/query
 * Query the AI knowledge assistant
 */
router.post('/assistant/query', async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({
        error: 'Missing question',
      });
    }

    const response = await aiKnowledgeAssistant.query({
      question,
      context,
    });

    res.json({
      data: response,
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to query assistant',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/knowledge/stats
 * Get knowledge base statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const assistantStats = aiKnowledgeAssistant.getStats();
    
    // Get decision stats
    const allDecisions = decisionLog.queryDecisions({});
    const decisionsByStatus = allDecisions.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      data: {
        assistant: assistantStats,
        decisions: {
          total: allDecisions.length,
          byStatus: decisionsByStatus,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

export default router;
