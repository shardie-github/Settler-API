"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickBooksAdapter = void 0;
class QuickBooksAdapter {
    name = "quickbooks";
    version = "1.0.0";
    async fetch(options) {
        const { dateRange, config } = options;
        const clientId = config.clientId;
        const clientSecret = config.clientSecret;
        if (!clientId || !clientSecret) {
            throw new Error("QuickBooks client ID and secret are required");
        }
        // In production, use QuickBooks API SDK
        // Mock implementation
        return [
            {
                id: "transaction_123",
                amount: 99.99,
                currency: "USD",
                date: new Date(),
                metadata: { transaction_id: "transaction_123" },
                sourceId: "transaction_123",
                referenceId: "transaction_123",
            },
        ];
    }
    normalize(data) {
        const transaction = data;
        return {
            id: transaction.Id,
            amount: Math.abs(transaction.Amount),
            currency: transaction.CurrencyRef?.value || "USD",
            date: new Date(transaction.TxnDate),
            metadata: {
                doc_number: transaction.DocNumber,
            },
            sourceId: transaction.Id,
            referenceId: transaction.DocNumber,
        };
    }
    validate(data) {
        const errors = [];
        if (!data.id) {
            errors.push("ID is required");
        }
        if (!data.amount) {
            errors.push("Amount is required");
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
}
exports.QuickBooksAdapter = QuickBooksAdapter;
//# sourceMappingURL=quickbooks.js.map