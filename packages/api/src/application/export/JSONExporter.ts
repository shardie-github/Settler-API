/**
 * JSON Exporter
 * 
 * Exports reconciled data to JSON format for programmatic access
 */

import { Transaction, Settlement, Fee, ReconciliationMatch } from '../../domain/canonical/types';
import { query } from '../../db';

export interface JSONExportOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  includeFees: boolean;
  includeUnmatched: boolean;
  includeRawPayloads: boolean;
}

export interface JSONExportResult {
  exportDate: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalMatches: number;
    totalUnmatched: number;
    totalFees: number;
  };
  matches: Array<{
    match: ReconciliationMatch;
    transaction: Transaction;
    settlement: Settlement;
    fees?: Fee[];
  }>;
  unmatched?: Transaction[];
}

export class JSONExporter {
  /**
   * Export to JSON format
   */
  async exportToJSON(
    tenantId: string,
    jobId: string,
    options: JSONExportOptions
  ): Promise<JSONExportResult> {
    const { dateRange, includeFees, includeUnmatched, includeRawPayloads } = options;

    // Get matches
    const matches = await query<ReconciliationMatch & {
      transaction_data: string;
      settlement_data: string;
    }>(
      `SELECT 
        rm.*,
        row_to_json(t.*) as transaction_data,
        row_to_json(s.*) as settlement_data
      FROM reconciliation_matches rm
      JOIN transactions t ON t.id = rm.transaction_id
      JOIN settlements s ON s.id = rm.settlement_id
      WHERE rm.tenant_id = $1 
        AND rm.job_id = $2
        AND t.created_at >= $3
        AND t.created_at <= $4
      ORDER BY t.created_at DESC`,
      [tenantId, jobId, dateRange.start, dateRange.end]
    );

    // Build result
    const result: JSONExportResult = {
      exportDate: new Date().toISOString(),
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      summary: {
        totalMatches: matches.length,
        totalUnmatched: 0,
        totalFees: 0,
      },
      matches: [],
    };

    // Process matches
    for (const match of matches) {
      const transaction = JSON.parse(match.transaction_data);
      const settlement = JSON.parse(match.settlement_data);

      // Remove raw payloads if not requested
      if (!includeRawPayloads) {
        delete transaction.raw_payload;
        delete settlement.raw_payload;
      }

      const matchEntry: any = {
        match: {
          id: match.id,
          tenantId: match.tenantId,
          executionId: match.executionId,
          jobId: match.jobId,
          transactionId: match.transactionId,
          settlementId: match.settlementId,
          matchType: match.matchType,
          confidenceScore: match.confidenceScore,
          matchingRules: match.matchingRules,
          matchedAt: match.matchedAt.toISOString(),
          createdAt: match.createdAt.toISOString(),
        },
        transaction,
        settlement,
      };

      // Add fees if included
      if (includeFees) {
        const fees = await query<Fee>(
          `SELECT * FROM fees WHERE transaction_id = $1 AND tenant_id = $2`,
          [match.transactionId, tenantId]
        );

        matchEntry.fees = fees.map(fee => {
          const feeObj: any = { ...fee };
          if (!includeRawPayloads) {
            delete feeObj.raw_payload;
          }
          return feeObj;
        });
        result.summary.totalFees += fees.length;
      }

      result.matches.push(matchEntry);
    }

    // Add unmatched if included
    if (includeUnmatched) {
      const unmatched = await query<Transaction>(
        `SELECT * FROM transactions t
         LEFT JOIN reconciliation_matches rm ON rm.transaction_id = t.id
         WHERE t.tenant_id = $1
           AND rm.id IS NULL
           AND t.created_at >= $2
           AND t.created_at <= $3
         ORDER BY t.created_at DESC`,
        [tenantId, dateRange.start, dateRange.end]
      );

      result.unmatched = unmatched.map(tx => {
        const txObj: any = { ...tx };
        if (!includeRawPayloads) {
          delete txObj.raw_payload;
        }
        return txObj;
      });

      result.summary.totalUnmatched = unmatched.length;
    }

    return result;
  }
}
