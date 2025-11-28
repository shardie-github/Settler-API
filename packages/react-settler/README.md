# @settler/react-settler

React components for building reconciliation workflows declaratively.

## Installation

```bash
npm install @settler/react-settler @settler/protocol
```

## Overview

`@settler/react-settler` provides React components that let you define reconciliation UIs and rules declaratively. These components can be:

1. **Rendered as UI** - Display reconciliation dashboards with live data
2. **Compiled to JSON** - Extract configuration for backend reconciliation engines

## Quick Start

### UI Mode - Rendering a Dashboard

```tsx
import {
  ReconciliationDashboard,
  TransactionTable,
  ExceptionTable,
  MetricCard
} from '@settler/react-settler';
import type { ReconciliationTransaction, ReconciliationException } from '@settler/react-settler';

function MyDashboard() {
  const transactions: ReconciliationTransaction[] = [
    {
      id: 'tx-1',
      provider: 'stripe',
      providerTransactionId: 'ch_123',
      amount: { value: 100.00, currency: 'USD' },
      currency: 'USD',
      date: '2024-01-01T00:00:00Z',
      status: 'succeeded'
    }
  ];

  const exceptions: ReconciliationException[] = [
    {
      id: 'exc-1',
      category: 'amount_mismatch',
      severity: 'high',
      description: 'Transaction amount does not match settlement',
      resolutionStatus: 'open',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  return (
    <ReconciliationDashboard>
      <MetricCard title="Match Rate" value="95%" />
      <TransactionTable transactions={transactions} />
      <ExceptionTable exceptions={exceptions} />
    </ReconciliationDashboard>
  );
}
```

### Config Mode - Compiling to JSON

```tsx
import {
  ReconciliationDashboard,
  RuleSet,
  MatchRule,
  compileToJSON
} from '@settler/react-settler';

const workflow = (
  <ReconciliationDashboard>
    <RuleSet id="rules-1" name="Primary Rules" priority="exact-first">
      <MatchRule
        id="rule-1"
        name="Exact Amount Match"
        field="amount"
        type="exact"
        priority={1}
      />
      <MatchRule
        id="rule-2"
        name="Date Range Match"
        field="date"
        type="range"
        tolerance={{ days: 7 }}
        priority={2}
      />
    </RuleSet>
  </ReconciliationDashboard>
);

const jsonConfig = compileToJSON(workflow, {
  name: 'My Reconciliation Workflow',
  description: 'E-commerce payment reconciliation',
  pretty: true
});

console.log(jsonConfig);
```

## Components

### `<ReconciliationDashboard>`

Main wrapper component that provides compilation context.

**Props:**
- `mode?: 'ui' | 'config'` - Rendering mode (default: 'ui')
- `config?: Partial<ReconciliationConfig>` - Initial config (for config mode)
- `children: ReactNode` - Child components

### `<TransactionTable>`

Displays reconciliation transactions in a table.

**Props:**
- `transactions: ReconciliationTransaction[]` - Array of transactions
- `onSelect?: (tx: ReconciliationTransaction) => void` - Selection handler
- `showProvider?: boolean` - Show provider column (default: true)
- `showStatus?: boolean` - Show status column (default: true)

### `<ExceptionTable>`

Displays exceptions requiring manual review.

**Props:**
- `exceptions: ReconciliationException[]` - Array of exceptions
- `onResolve?: (exc: ReconciliationException) => void` - Resolution handler
- `showSeverity?: boolean` - Show severity column (default: true)
- `showCategory?: boolean` - Show category column (default: true)

### `<MetricCard>`

Displays a key reconciliation metric.

**Props:**
- `title: string` - Metric title
- `value: string | number` - Metric value
- `subtitle?: string` - Optional subtitle
- `trend?: 'up' | 'down' | 'neutral'` - Trend indicator

### `<RuleSet>`

Defines a collection of reconciliation rules.

**Props:**
- `id: string` - Unique ruleset ID
- `name: string` - Ruleset name
- `priority?: 'exact-first' | 'fuzzy-first' | 'custom'` - Rule priority strategy
- `conflictResolution?: 'first-wins' | 'last-wins' | 'manual-review'` - Conflict resolution
- `children: ReactNode` - `<MatchRule>` components

### `<MatchRule>`

Defines a single reconciliation matching rule.

**Props:**
- `id: string` - Unique rule ID
- `name: string` - Rule name
- `field: RuleField` - Field to match on
- `type: RuleType` - Match type ('exact' | 'fuzzy' | 'range' | 'regex')
- `tolerance?: RuleTolerance` - Tolerance settings
- `priority?: number` - Rule priority (lower = higher priority)
- `enabled?: boolean` - Whether rule is enabled (default: true)

## Compiler API

### `compileToConfig(component, options?)`

Compiles a React component tree into a `ReconciliationConfig` object.

```tsx
import { compileToConfig } from '@settler/react-settler';

const config = compileToConfig(workflow, {
  name: 'My Workflow',
  description: 'Payment reconciliation'
});
```

### `compileToJSON(component, options?)`

Compiles a React component tree into a JSON string.

```tsx
import { compileToJSON } from '@settler/react-settler';

const json = compileToJSON(workflow, {
  name: 'My Workflow',
  pretty: true // Pretty-print JSON
});
```

## Usage Modes

### UI Mode (Default)

Components render as normal React UI with live data:

```tsx
<ReconciliationDashboard mode="ui">
  <TransactionTable transactions={transactions} />
</ReconciliationDashboard>
```

### Config Mode

Components extract configuration without rendering UI:

```tsx
<ReconciliationDashboard mode="config">
  <RuleSet id="rules-1" name="My Rules">
    <MatchRule id="rule-1" name="Amount Match" field="amount" type="exact" />
  </RuleSet>
</ReconciliationDashboard>
```

## Examples

See the `examples/` directory for complete examples:

- `basic-dashboard.tsx` - Simple dashboard with transactions and exceptions
- `rule-definition.tsx` - Defining reconciliation rules
- `config-compilation.tsx` - Compiling workflows to JSON

## Protocol

This library uses `@settler/protocol` for type definitions. See [@settler/protocol](../protocol/README.md) for the complete protocol specification.

## License

MIT
