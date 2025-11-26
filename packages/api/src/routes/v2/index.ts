/**
 * API v2 Routes
 * Version 2 of the Settler API (future version)
 */

import { Router } from 'express';

export const v2Router = Router();

// v2 routes will be implemented here
// For now, return deprecation notice
v2Router.use('*', (req, res) => {
  res.status(501).json({
    error: 'NotImplemented',
    message: 'API v2 is not yet available',
    version: '2.0.0',
    deprecation: {
      current: 'v1',
      sunset: null, // TBD
    },
  });
});
