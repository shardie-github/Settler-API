/**
 * Settlements API Routes
 * 
 * REST API endpoints for settlement management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation';
import { AuthRequest } from '../../middleware/auth';
import { requirePermission } from '../../middleware/authorization';
import { query } from '../../db';
import { sendSuccess, sendError, sendPaginated } from '../../utils/api-response';

const router = Router();

// Validation schemas
const getSettlementsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
    provider: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

const getSettlementSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * GET /api/v1/settlements
 * List settlements with filtering and pagination
 */
router.get(
  '/',
  requirePermission('settlements', 'read'),
  validateRequest(getSettlementsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, provider, status, startDate, endDate } = req.query;
      const tenantId = req.tenantId!;
      const offset = (page - 1) * limit;

      let whereClause = 'tenant_id = $1';
      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (provider) {
        whereClause += ` AND provider = $${paramIndex}`;
        params.push(provider);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (startDate) {
        whereClause += ` AND settlement_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND settlement_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM settlements WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult[0].count, 10);

      // Get settlements
      const settlements = await query(
        `SELECT 
          id,
          tenant_id as "tenantId",
          provider,
          provider_settlement_id as "providerSettlementId",
          amount_value as "amount.value",
          amount_currency as "amount.currency",
          currency,
          fx_rate as "fxRate",
          settlement_date as "settlementDate",
          expected_date as "expectedDate",
          status,
          raw_payload as "rawPayload",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM settlements 
        WHERE ${whereClause}
        ORDER BY settlement_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      sendPaginated(res, settlements, total, page, limit);
    } catch (error: any) {
      sendError(res, 'Internal Server Error', error.message || 'Failed to fetch settlements', 500);
    }
  }
);

/**
 * GET /api/v1/settlements/:id
 * Get settlement by ID
 */
router.get(
  '/:id',
  requirePermission('settlements', 'read'),
  validateRequest(getSettlementSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const settlements = await query(
        `SELECT 
          id,
          tenant_id as "tenantId",
          provider,
          provider_settlement_id as "providerSettlementId",
          amount_value as "amount.value",
          amount_currency as "amount.currency",
          currency,
          fx_rate as "fxRate",
          settlement_date as "settlementDate",
          expected_date as "expectedDate",
          status,
          raw_payload as "rawPayload",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM settlements 
        WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );

      if (settlements.length === 0) {
        return sendError(res, 'Not Found', 'Settlement not found', 404);
      }

      sendSuccess(res, settlements[0]);
    } catch (error: any) {
      sendError(res, 'Internal Server Error', error.message || 'Failed to fetch settlement', 500);
    }
  }
);

export default router;
