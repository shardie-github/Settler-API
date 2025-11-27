"use strict";
/**
 * Reconciliation Service
 * Main service that orchestrates reconciliation workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const ReconciliationCommandHandlers_1 = require("../cqrs/commands/ReconciliationCommandHandlers");
const SagaOrchestrator_1 = require("../sagas/SagaOrchestrator");
const ShopifyStripeReconciliationSaga_1 = require("../sagas/ShopifyStripeReconciliationSaga");
class ReconciliationService {
    commandHandlers;
    sagaOrchestrator;
    constructor(eventStore, eventBus, shopifyAdapter, stripeAdapter) {
        this.commandHandlers = new ReconciliationCommandHandlers_1.ReconciliationCommandHandlers(eventStore, eventBus);
        this.sagaOrchestrator = new SagaOrchestrator_1.SagaOrchestrator(undefined, // Will use default pool
        eventStore, eventBus);
        // Register Shopify-Stripe reconciliation saga
        const shopifyStripeSaga = new ShopifyStripeReconciliationSaga_1.ShopifyStripeReconciliationSaga(eventStore, shopifyAdapter, stripeAdapter);
        this.sagaOrchestrator.registerSaga(shopifyStripeSaga.createDefinition());
        // Subscribe to reconciliation started events to trigger saga
        eventBus.subscribe('reconciliation.started', async (event) => {
            const reconciliationId = event.reconciliationId;
            const jobId = event.jobId;
            const correlationId = event.correlationId;
            // Start saga
            await this.sagaOrchestrator.startSaga('shopify_stripe_monthly_reconciliation', reconciliationId, {
                job_id: jobId,
                started_at: Date.now(),
                date_range: event.dateRange || {},
                shopify_config: event.shopifyConfig || {},
                stripe_config: event.stripeConfig || {},
                matching_rules: event.matchingRules || {},
            }, event.tenantId || 'default', correlationId);
        });
    }
    /**
     * Start a reconciliation
     */
    async startReconciliation(command) {
        await this.commandHandlers.handleStartReconciliation(command);
    }
    /**
     * Retry a reconciliation
     */
    async retryReconciliation(command) {
        await this.commandHandlers.handleRetryReconciliation(command);
    }
    /**
     * Cancel a reconciliation
     */
    async cancelReconciliation(command) {
        await this.commandHandlers.handleCancelReconciliation(command);
    }
    /**
     * Get saga orchestrator (for admin operations)
     */
    getSagaOrchestrator() {
        return this.sagaOrchestrator;
    }
}
exports.ReconciliationService = ReconciliationService;
//# sourceMappingURL=ReconciliationService.js.map