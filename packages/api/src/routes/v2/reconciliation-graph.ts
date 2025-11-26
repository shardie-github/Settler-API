/**
 * Continuous Reconciliation Graph API Routes
 * 
 * REST API for graph-based reconciliation
 */

import { Router, Request, Response } from 'express';
import { graphEngine } from '../../services/reconciliation-graph/graph-engine';
import { streamProcessor } from '../../services/reconciliation-graph/stream-processor';
import { ReconciliationNode, ReconciliationEdge, GraphQuery } from '../../services/reconciliation-graph/types';

const router = Router();

/**
 * POST /api/v2/reconciliation-graph/:jobId/nodes
 * Add a node to the graph
 */
router.post('/:jobId/nodes', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const node: ReconciliationNode = {
      id: req.body.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: req.body.type || 'transaction',
      jobId,
      sourceId: req.body.sourceId,
      targetId: req.body.targetId,
      data: req.body.data || {},
      amount: req.body.amount,
      currency: req.body.currency,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      confidence: req.body.confidence,
      metadata: req.body.metadata,
    };

    graphEngine.addNode(jobId, node);

    // Add to stream processor for real-time matching
    await streamProcessor.addEvent({
      id: node.id,
      jobId,
      type: node.sourceId ? 'source' : 'target',
      sourceId: node.sourceId,
      targetId: node.targetId,
      data: node.data,
      amount: node.amount,
      currency: node.currency,
      timestamp: node.timestamp,
    });

    res.status(201).json({
      data: node,
      message: 'Node added successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to add node',
      message: error.message,
    });
  }
});

/**
 * POST /api/v2/reconciliation-graph/:jobId/edges
 * Add an edge to the graph
 */
router.post('/:jobId/edges', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const edge: ReconciliationEdge = {
      id: req.body.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: req.body.source,
      target: req.body.target,
      type: req.body.type || 'matches',
      confidence: req.body.confidence || 1.0,
      metadata: req.body.metadata,
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
    };

    graphEngine.addEdge(jobId, edge);

    res.status(201).json({
      data: edge,
      message: 'Edge added successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to add edge',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/reconciliation-graph/:jobId/query
 * Query the graph
 */
router.get('/:jobId/query', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const query: GraphQuery = {
      jobId,
      nodeType: req.query.nodeType as ReconciliationNode['type'],
      sourceId: req.query.sourceId as string,
      targetId: req.query.targetId as string,
      dateRange: req.query.startDate && req.query.endDate ? {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string),
      } : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = graphEngine.query(query);

    res.json({
      data: {
        nodes: result.nodes,
        edges: result.edges,
        count: result.nodes.length,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to query graph',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/reconciliation-graph/:jobId/state
 * Get current graph state
 */
router.get('/:jobId/state', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const graph = graphEngine.getGraphState(jobId);

    if (!graph) {
      return res.status(404).json({
        error: 'Graph not found',
        message: `No graph found for job ${jobId}`,
      });
    }

    res.json({
      data: {
        jobId: graph.jobId,
        nodeCount: graph.nodes.size,
        edgeCount: graph.edges.size,
        updatedAt: graph.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to get graph state',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/reconciliation-graph/:jobId/stream
 * Server-Sent Events stream for real-time updates
 */
router.get('/:jobId/stream', (req: Request, res: Response) => {
  const { jobId } = req.params;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Subscribe to graph updates
  const unsubscribe = graphEngine.subscribe(jobId, (update) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  });

  // Clean up on client disconnect
  req.on('close', () => {
    unsubscribe();
    res.end();
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`);
});

export default router;
