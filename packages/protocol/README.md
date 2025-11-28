# @settler/protocol

Framework-agnostic protocol types for reconciliation workflows.

## Installation

```bash
npm install @settler/protocol
```

## Overview

`@settler/protocol` defines the core types and JSON schema for reconciliation UI definitions and rules. It is designed to be consumed by any reconciliation backend, not just Settler's proprietary engine.

## Key Features

- ✅ Framework-agnostic TypeScript types
- ✅ Backend-agnostic JSON config schema
- ✅ Type-safe rule definitions
- ✅ Extensible widget system
- ✅ Versioned protocol for stability

## Usage

```typescript
import {
  ReconciliationTransaction,
  ReconciliationSettlement,
  ReconciliationRule,
  ReconciliationConfig
} from '@settler/protocol';

// Define a reconciliation rule
const rule: ReconciliationRule = {
  id: 'rule-1',
  name: 'Exact Amount Match',
  field: 'amount',
  type: 'exact',
  priority: 1
};

// Create a reconciliation config
const config: ReconciliationConfig = {
  version: '1.0.0',
  metadata: {
    name: 'My Reconciliation Workflow',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  rulesets: [],
  views: [],
  widgets: {}
};
```

## Protocol Documentation

See [PROTOCOL.md](./PROTOCOL.md) for the complete protocol specification.

## License

MIT
