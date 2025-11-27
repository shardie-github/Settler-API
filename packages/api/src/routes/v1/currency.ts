/**
 * Currency/FX API Routes
 * 
 * REST API endpoints for multi-currency operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation';
import { AuthRequest } from '../../middleware/auth';
import { requirePermission } from '../../middleware/authorization';
import { FXService } from '../../application/currency/FXService';
import { sendSuccess, sendError } from '../../utils/api-response';

const router = Router();
const fxService = new FXService();

// Validation schemas
const convertCurrencySchema = z.object({
  body: z.object({
    amount: z.object({
      value: z.number(),
      currency: z.string(),
    }),
    toCurrency: z.string(),
    date: z.string().datetime().optional(),
  }),
});

const getFXRateSchema = z.object({
  query: z.object({
    fromCurrency: z.string(),
    toCurrency: z.string(),
    date: z.string().datetime().optional(),
  }),
});

/**
 * POST /api/v1/currency/convert
 * Convert amount to base currency
 */
router.post(
  '/convert',
  requirePermission('currency', 'read'),
  validateRequest(convertCurrencySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, toCurrency, date } = req.body;
      const tenantId = req.tenantId!;

      const converted = await fxService.convertToBaseCurrency(
        tenantId,
        amount,
        toCurrency,
        date ? new Date(date) : undefined
      );

      if (!converted) {
        return sendError(res, 'Not Found', 'FX rate not available for currency pair', 404);
      }

      sendSuccess(res, { original: amount, converted });
    } catch (error: any) {
      sendError(res, 'Internal Server Error', error.message || 'Failed to convert currency', 500);
    }
  }
);

/**
 * GET /api/v1/currency/fx-rate
 * Get FX rate for currency pair
 */
router.get(
  '/fx-rate',
  requirePermission('currency', 'read'),
  validateRequest(getFXRateSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fromCurrency, toCurrency, date } = req.query;
      const tenantId = req.tenantId!;

      const rate = await fxService.getFXRate(
        tenantId,
        fromCurrency as string,
        toCurrency as string,
        date ? new Date(date as string) : undefined
      );

      if (rate === null) {
        return sendError(res, 'Not Found', 'FX rate not available for currency pair', 404);
      }

      sendSuccess(res, {
        fromCurrency,
        toCurrency,
        rate,
        date: date || new Date().toISOString(),
      });
    } catch (error: any) {
      sendError(res, 'Internal Server Error', error.message || 'Failed to get FX rate', 500);
    }
  }
);

/**
 * GET /api/v1/currency/base-currency
 * Get base currency for tenant
 */
router.get(
  '/base-currency',
  requirePermission('currency', 'read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const baseCurrency = await fxService.getBaseCurrency(tenantId);
      sendSuccess(res, { baseCurrency });
    } catch (error: any) {
      sendError(res, 'Internal Server Error', error.message || 'Failed to get base currency', 500);
    }
  }
);

/**
 * GET /api/v1/currency/fx-rates
 * Get all FX rates for tenant
 */
router.get(
  '/fx-rates',
  requirePermission('currency', 'read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const rates = await fxService.getFXRates(tenantId, date);
      sendSuccess(res, { rates });
    } catch (error: any) {
      sendError(res, 'Internal Server Error', error.message || 'Failed to get FX rates', 500);
    }
  }
);

export default router;
