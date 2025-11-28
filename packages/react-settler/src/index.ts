/**
 * @settler/react-settler
 * 
 * React components for building reconciliation workflows.
 * 
 * @license MIT
 */

// Components
export { ReconciliationDashboard } from './components/ReconciliationDashboard';
export { TransactionTable } from './components/TransactionTable';
export { ExceptionTable } from './components/ExceptionTable';
export { MetricCard } from './components/MetricCard';
export { RuleSet } from './components/RuleSet';
export { MatchRule } from './components/MatchRule';

// Context
export { CompilationProvider, useCompilationContext } from './context';

// Types
export type { ReconciliationDashboardProps } from './components/ReconciliationDashboard';
export type { TransactionTableProps } from './components/TransactionTable';
export type { ExceptionTableProps } from './components/ExceptionTable';
export type { MetricCardProps } from './components/MetricCard';
export type { RuleSetProps } from './components/RuleSet';
export type { MatchRuleProps } from './components/MatchRule';
export type { CompilationProviderProps } from './context';

// Compiler
export { compileToConfig, compileToJSON } from './compiler';

// Re-export protocol types for convenience
export type {
  ReconciliationTransaction,
  ReconciliationSettlement,
  ReconciliationException,
  ReconciliationMatch,
  ReconciliationRule,
  ReconciliationRuleSet,
  ReconciliationConfig,
  ReconciliationViewConfig,
  Money,
  TransactionStatus,
  SettlementStatus,
  MatchType,
  ExceptionCategory,
  ExceptionSeverity,
  ExceptionResolutionStatus,
  RuleField,
  RuleType,
  RuleTolerance,
  WidgetType,
  WidgetConfig,
  CompilationMode
} from '@settler/protocol';
