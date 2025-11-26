/**
 * Compliance API Routes
 * 
 * REST API for compliance exports and edge agent management
 */

import { Router, Request, Response } from 'express';
import { complianceExportSystem } from '../../services/compliance/export-system';
import { EdgeAgent } from '../../services/privacy-preserving/edge-agent';

const router = Router();

/**
 * POST /api/v2/compliance/exports
 * Create a compliance export
 */
router.post('/exports', async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.id || req.body.customerId;
    const { jurisdiction, format } = req.body;

    if (!customerId || !jurisdiction) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'customerId and jurisdiction are required',
      });
    }

    const export_ = await complianceExportSystem.createExport(
      customerId,
      jurisdiction,
      format || 'json'
    );

    res.status(201).json({
      data: export_,
      message: 'Export created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to create export',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/compliance/exports
 * List exports for customer
 */
router.get('/exports', async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.id || req.query.customerId as string;

    if (!customerId) {
      return res.status(400).json({
        error: 'Missing customer ID',
      });
    }

    const exports = complianceExportSystem.listExports(customerId);

    res.json({
      data: exports,
      count: exports.length,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list exports',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/compliance/exports/:id
 * Get export by ID
 */
router.get('/exports/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const export_ = complianceExportSystem.getExport(id);

    if (!export_) {
      return res.status(404).json({
        error: 'Export not found',
        message: `Export ${id} not found`,
      });
    }

    res.json({
      data: export_,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get export',
      message: error.message,
    });
  }
});

/**
 * GET /api/v2/compliance/templates
 * Get available export templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = complianceExportSystem.getTemplates();

    res.json({
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get templates',
      message: error.message,
    });
  }
});

/**
 * POST /api/v2/compliance/edge/initialize
 * Initialize edge agent
 */
router.post('/edge/initialize', async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.id || req.body.customerId;
    const { apiKey, cloudEndpoint, reconciliationRules, encryptionKey } = req.body;

    if (!customerId || !apiKey || !cloudEndpoint || !reconciliationRules) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'customerId, apiKey, cloudEndpoint, and reconciliationRules are required',
      });
    }

    const edgeAgent = new EdgeAgent({
      customerId,
      apiKey,
      cloudEndpoint: cloudEndpoint || 'https://api.settler.io',
      reconciliationRules,
      encryptionKey,
    });

    await edgeAgent.initialize();

    res.json({
      data: {
        customerId,
        initialized: true,
      },
      message: 'Edge agent initialized successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to initialize edge agent',
      message: error.message,
    });
  }
});

export default router;
