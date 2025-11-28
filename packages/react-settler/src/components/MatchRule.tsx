/**
 * MatchRule
 * Defines a single reconciliation matching rule
 */

import React from 'react';
import {
  ReconciliationRule,
  RuleField,
  RuleType
} from '@settler/protocol';
import { useCompilationContext } from '../context';

export interface MatchRuleProps {
  id: string;
  name: string;
  field: RuleField;
  type: RuleType;
  tolerance?: {
    amount?: number;
    days?: number;
    percentage?: number;
    threshold?: number;
  };
  priority?: number;
  enabled?: boolean;
}

export function MatchRule({
  id,
  name,
  field,
  type,
  tolerance,
  priority,
  enabled = true
}: MatchRuleProps) {
  const context = useCompilationContext();

  // In config mode, add rule to the most recent ruleset
  if (context.mode === 'config') {
    if (!context.config.rulesets || context.config.rulesets.length === 0) {
      // Create a default ruleset if none exists
      context.config.rulesets = [{
        id: 'default-ruleset',
        name: 'Default Rules',
        rules: [],
        priority: 'exact-first'
      }];
    }

    const ruleset = context.config.rulesets[context.config.rulesets.length - 1];
    const rule: ReconciliationRule = {
      id,
      name,
      field,
      type,
      tolerance,
      priority,
      enabled
    };

    ruleset.rules.push(rule);
  }

  // In UI mode, render rule display (optional)
  if (context.mode === 'ui') {
    return (
      <div data-rule-id={id} data-rule-field={field} data-rule-type={type}>
        <strong>{name}</strong>
        <span>Field: {field}</span>
        <span>Type: {type}</span>
        {tolerance && <span>Tolerance: {JSON.stringify(tolerance)}</span>}
      </div>
    );
  }

  // Config mode: return null (rule registered above)
  return null;
}
