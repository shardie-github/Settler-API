/**
 * Confidence Scoring Service
 * E2: Matching engine improvements - Confidence scoring algorithm
 */
import { MatchingRule } from "../domain/entities/Job";
export interface MatchCandidate {
    sourceId: string;
    targetId: string;
    sourceData: Record<string, unknown>;
    targetData: Record<string, unknown>;
    rules: MatchingRule[];
}
export interface ConfidenceScore {
    score: number;
    breakdown: Array<{
        rule: MatchingRule;
        score: number;
        reason: string;
    }>;
    factors: {
        exactMatches: number;
        fuzzyMatches: number;
        rangeMatches: number;
        totalRules: number;
    };
}
/**
 * Calculate confidence score for a match
 * @param candidate - Match candidate with source and target data
 * @param rules - Matching rules to apply
 * @returns Confidence score (0-1) with breakdown
 */
export declare function calculateConfidenceScore(candidate: MatchCandidate, rules: MatchingRule[]): ConfidenceScore;
/**
 * Explain confidence score in human-readable format
 */
export declare function explainConfidenceScore(confidence: ConfidenceScore): string;
//# sourceMappingURL=confidence-scoring.d.ts.map