"use strict";
/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.sendPaginated = sendPaginated;
exports.sendCreated = sendCreated;
exports.sendNoContent = sendNoContent;
/**
 * Send success response
 */
function sendSuccess(res, data, message, statusCode = 200) {
    const response = {
        data,
    };
    if (message) {
        response.message = message;
    }
    res.status(statusCode).json(response);
}
/**
 * Send error response
 */
function sendError(res, error, message, statusCode = 400, code, details) {
    const response = {
        error,
        message,
    };
    if (code) {
        response.code = code;
    }
    if (details) {
        response.details = details;
    }
    res.status(statusCode).json(response);
}
/**
 * Send paginated response
 */
function sendPaginated(res, data, meta) {
    const response = {
        data,
        meta: {
            page: meta.page,
            limit: meta.limit,
            total: meta.total,
            cursor: meta.cursor,
        },
    };
    res.status(200).json(response);
}
/**
 * Send created response
 */
function sendCreated(res, data, message) {
    sendSuccess(res, data, message, 201);
}
/**
 * Send no content response
 */
function sendNoContent(res) {
    res.status(204).send();
}
//# sourceMappingURL=api-response.js.map