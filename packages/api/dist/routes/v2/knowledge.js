"use strict";
/**
 * Knowledge Management API Routes
 *
 * REST API for decision logs and AI knowledge assistant
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const decision_log_1 = require("../../services/knowledge/decision-log");
const ai_assistant_1 = require("../../services/knowledge/ai-assistant");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
/**
 * POST /api/v2/knowledge/decisions
 * Create a new decision
 */
router.post('/decisions', async (req, res) => {
    try {
        const decision = await decision_log_1.decisionLog.createDecision(req.body);
        res.status(201).json({
            data: decision,
            message: 'Decision created successfully',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to create decision', 400);
    }
});
/**
 * GET /api/v2/knowledge/decisions
 * Query decisions
 */
router.get('/decisions', async (req, res) => {
    try {
        const decisions = decision_log_1.decisionLog.queryDecisions({
            status: req.query.status,
            decisionMaker: req.query.decisionMaker,
            tag: req.query.tag,
            dateRange: req.query.startDate && req.query.endDate ? {
                start: new Date(req.query.startDate),
                end: new Date(req.query.endDate),
            } : undefined,
            search: req.query.search,
        });
        res.json({
            data: decisions,
            count: decisions.length,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to query decisions', 400);
    }
});
/**
 * GET /api/v2/knowledge/decisions/:id
 * Get a decision by ID
 */
router.get('/decisions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const decision = decision_log_1.decisionLog.getDecision(id);
        if (!decision) {
            return res.status(404).json({
                error: 'Decision not found',
                message: `Decision ${id} not found`,
            });
        }
        const related = decision_log_1.decisionLog.getRelatedDecisions(id);
        res.json({
            data: {
                ...decision,
                relatedDecisions: related,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get decision', 400);
    }
});
/**
 * PATCH /api/v2/knowledge/decisions/:id/outcomes
 * Update decision outcomes
 */
router.patch('/decisions/:id/outcomes', async (req, res) => {
    try {
        const { id } = req.params;
        const { outcome } = req.body;
        if (!outcome) {
            return res.status(400).json({
                error: 'Missing outcome',
            });
        }
        const decision = await decision_log_1.decisionLog.updateOutcomes(id, outcome);
        res.json({
            data: decision,
            message: 'Outcome updated successfully',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to update outcome', 400);
    }
});
/**
 * POST /api/v2/knowledge/assistant/query
 * Query the AI knowledge assistant
 */
router.post('/assistant/query', async (req, res) => {
    try {
        const { question, context } = req.body;
        if (!question) {
            return res.status(400).json({
                error: 'Missing question',
            });
        }
        const response = await ai_assistant_1.aiKnowledgeAssistant.query({
            question,
            context,
        });
        res.json({
            data: response,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to query assistant', 400);
    }
});
/**
 * GET /api/v2/knowledge/stats
 * Get knowledge base statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const assistantStats = ai_assistant_1.aiKnowledgeAssistant.getStats();
        // Get decision stats
        const allDecisions = decision_log_1.decisionLog.queryDecisions({});
        const decisionsByStatus = allDecisions.reduce((acc, d) => {
            acc[d.status] = (acc[d.status] || 0) + 1;
            return acc;
        }, {});
        res.json({
            data: {
                assistant: assistantStats,
                decisions: {
                    total: allDecisions.length,
                    byStatus: decisionsByStatus,
                },
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get stats', 500);
    }
});
exports.default = router;
//# sourceMappingURL=knowledge.js.map