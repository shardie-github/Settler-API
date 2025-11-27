/**
 * Pagination Utilities
 * Cursor-based pagination for better performance at scale
 */
export interface CursorPaginationParams {
    cursor?: string;
    limit?: number;
    direction?: 'next' | 'prev';
}
export interface CursorPaginationResult<T> {
    items: T[];
    nextCursor?: string;
    prevCursor?: string;
    hasMore: boolean;
}
/**
 * Decode cursor from base64
 */
export declare function decodeCursor(cursor: string): {
    created_at: string;
    id: string;
} | null;
/**
 * Encode cursor to base64
 */
export declare function encodeCursor(created_at: string | Date, id: string): string;
/**
 * Build cursor-based WHERE clause for SQL
 */
export declare function buildCursorWhereClause(params: CursorPaginationParams, tableAlias?: string): {
    whereClause: string;
    params: (string | number)[];
    paramIndex: number;
};
/**
 * Build cursor-based ORDER BY clause
 */
export declare function buildCursorOrderBy(direction?: 'next' | 'prev', tableAlias?: string): string;
/**
 * Generate pagination response with cursors
 */
export declare function createCursorPaginationResponse<T extends {
    created_at: Date | string;
    id: string;
}>(items: T[], limit: number, direction?: 'next' | 'prev'): CursorPaginationResult<T>;
/**
 * Parse pagination params from query string
 */
export declare function parseCursorPaginationParams(req: {
    query: Record<string, string | undefined>;
}): CursorPaginationParams;
//# sourceMappingURL=pagination.d.ts.map