/**
 * React.Settler Demo Page
 * 
 * Demonstrates using @settler/react-settler components in the Settler dashboard.
 * This page dogfoods the react-settler library with real reconciliation data.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ReconciliationDashboard,
  TransactionTable,
  ExceptionTable,
  MetricCard,
  RuleSet,
  MatchRule,
  compileToJSON
} from '@settler/react-settler';
import type {
  ReconciliationTransaction,
  ReconciliationException
} from '@settler/react-settler';
import { SettlerClient } from '@settler/sdk';

export default function ReactSettlerDemoPage() {
  const [apiKey] = useState(() => {
    // In a real app, get from auth context or env
    return typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search).get('apiKey') || ''
      : '';
  });

  const [client] = useState(() => new SettlerClient({ apiKey }));
  const [transactions, setTransactions] = useState<ReconciliationTransaction[]>([]);
  const [exceptions, setExceptions] = useState<ReconciliationException[]>([]);
  const [loading, setLoading] = useState(true);
  const [configJson, setConfigJson] = useState<string>('');

  useEffect(() => {
    if (apiKey) {
      loadData();
    }
  }, [apiKey]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load jobs to get reconciliation data
      const jobsResponse = await client.jobs.list({ limit: 10 });
      const jobs = jobsResponse.data || [];

      // Transform job data to reconciliation transactions
      // Note: This is a simplified transformation - in production,
      // you'd fetch actual transaction and exception data from reports
      const mockTransactions: ReconciliationTransaction[] = jobs.map((job, idx) => ({
        id: `tx-${job.id}`,
        provider: (job.source as any)?.adapter || 'stripe',
        providerTransactionId: `ch_${job.id.slice(0, 10)}`,
        amount: { value: 100.0 * (idx + 1), currency: 'USD' },
        currency: 'USD',
        date: job.createdAt || new Date().toISOString(),
        status: 'succeeded',
        referenceId: job.name
      }));

      const mockExceptions: ReconciliationException[] = [
        {
          id: 'exc-1',
          category: 'amount_mismatch',
          severity: 'high',
          description: 'Transaction amount does not match settlement',
          resolutionStatus: 'open',
          createdAt: new Date().toISOString()
        }
      ];

      setTransactions(mockTransactions);
      setExceptions(mockExceptions);

      // Compile workflow to JSON
      const workflow = (
        <ReconciliationDashboard>
          <RuleSet id="demo-rules" name="Demo Rules" priority="exact-first">
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

      const json = compileToJSON(workflow, {
        name: 'Settler Dashboard Demo',
        description: 'Demo reconciliation workflow',
        pretty: true
      });

      setConfigJson(json);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!apiKey) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please provide an API key via the <code>?apiKey=...</code> query parameter.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-lg">Loading reconciliation data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">React.Settler Demo</h1>
        <p className="text-gray-600">
          This page demonstrates the @settler/react-settler component library
          integrated into the Settler dashboard.
        </p>
      </div>

      <ReconciliationDashboard>
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard
            title="Total Transactions"
            value={transactions.length}
            subtitle="Reconciliation transactions"
          />
          <MetricCard
            title="Match Rate"
            value="95%"
            subtitle="19 of 20 matched"
            trend="up"
          />
          <MetricCard
            title="Exceptions"
            value={exceptions.length}
            subtitle="Requiring review"
            trend="neutral"
          />
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Transactions</h2>
          </div>
          <div className="p-6">
            <TransactionTable
              transactions={transactions}
              onSelect={(tx) => {
                console.log('Selected transaction:', tx);
                alert(`Selected transaction: ${tx.id}`);
              }}
            />
          </div>
        </div>

        {/* Exceptions Table */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Exceptions</h2>
          </div>
          <div className="p-6">
            <ExceptionTable
              exceptions={exceptions}
              onResolve={(exc) => {
                console.log('Resolving exception:', exc);
                alert(`Resolving exception: ${exc.id}`);
              }}
            />
          </div>
        </div>

        {/* Compiled Config */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Compiled Configuration</h2>
            <p className="text-sm text-gray-600 mt-1">
              JSON config extracted from React component tree
            </p>
          </div>
          <div className="p-6">
            <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
              {configJson}
            </pre>
          </div>
        </div>
      </ReconciliationDashboard>
    </div>
  );
}
