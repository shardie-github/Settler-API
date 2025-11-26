/**
 * API v1 Routes
 * Version 1 of the Settler API
 */

import { Router } from 'express';
import { jobsRouter } from './jobs';
import { reportsRouter } from './reports';
import { webhooksRouter } from './webhooks';
import { usersRouter } from './users';
import { tenantsRouter } from './tenants';
import { realtimeRouter } from '../realtime';
import { reconciliationSummaryRouter } from '../reconciliation-summary';

export const v1Router = Router();

// Mount v1 routes
v1Router.use('/jobs', jobsRouter);
v1Router.use('/reports', reportsRouter);
v1Router.use('/webhooks', webhooksRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/tenants', tenantsRouter);
v1Router.use('/realtime', realtimeRouter);
v1Router.use('/reconciliations', reconciliationSummaryRouter);

// Health check
v1Router.get('/health', (req, res) => {
  res.json({
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});
