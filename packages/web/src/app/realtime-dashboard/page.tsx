/**
 * Real-time Reconciliation Dashboard
 * Next.js/React page showing live reconciliation progress
 */

'use client';

import { useEffect, useState } from 'react';

interface ExecutionUpdate {
  type: string;
  executionId?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  summary?: {
    total_source_records?: number;
    total_target_records?: number;
    matched_count?: number;
    unmatched_source_count?: number;
    unmatched_target_count?: number;
    errors_count?: number;
    accuracy_percentage?: number;
  };
}

interface PageProps {
  params?: Record<string, string | string[] | undefined>;
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function RealtimeDashboard({ params, searchParams }: PageProps) {
  const jobId = (params?.jobId as string | undefined) || (searchParams?.jobId as string | undefined) || '';
  const apiKey = (searchParams?.apiKey as string | undefined) || '';
  const [connected, setConnected] = useState(false);
  const [execution, setExecution] = useState<ExecutionUpdate | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!jobId || !apiKey) {
      return;
    }

    // EventSource doesn't support custom headers, so we use fetch with streaming
    const url = `/api/v1/realtime/reconciliations/${jobId}?token=${encodeURIComponent(apiKey)}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setConnected(true);
      addLog('Connected to real-time updates');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ExecutionUpdate = JSON.parse(event.data);

        if (data.type === 'connected') {
          addLog('Connection established');
        } else if (data.type === 'execution_update') {
          setExecution(data);
          addLog(`Status update: ${data.status}`);

          if (data.error) {
            addError(data.error);
          }

          if (data.status === 'completed' || data.status === 'failed') {
            eventSource.close();
            setConnected(false);
            addLog('Reconciliation finished. Connection closed.');
          }
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setConnected(false);
      addLog('Connection error. Attempting to reconnect...');
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        eventSource.close();
        // Re-run effect to reconnect
        window.location.reload();
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [jobId, apiKey]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-99), `${new Date().toISOString()}: ${message}`]);
  };

  const addError = (error: string) => {
    setErrors((prev) => [...prev.slice(-49), `${new Date().toISOString()}: ${error}`]);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'running':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const ms = end.getTime() - start.getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Reconciliation Dashboard</h1>

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Execution Status */}
      {execution && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Execution Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-semibold ${getStatusColor(execution.status)}`}>
                {execution.status?.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <span className="ml-2 font-semibold">
                {formatDuration(execution.startedAt, execution.completedAt)}
              </span>
            </div>
            {execution.startedAt && (
              <div>
                <span className="text-gray-600">Started:</span>
                <span className="ml-2">
                  {new Date(execution.startedAt).toLocaleString()}
                </span>
              </div>
            )}
            {execution.completedAt && (
              <div>
                <span className="text-gray-600">Completed:</span>
                <span className="ml-2">
                  {new Date(execution.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Summary */}
          {execution.summary && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Source Records</div>
                  <div className="text-2xl font-bold">
                    {execution.summary.total_source_records || 0}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Target Records</div>
                  <div className="text-2xl font-bold">
                    {execution.summary.total_target_records || 0}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Matches</div>
                  <div className="text-2xl font-bold">
                    {execution.summary.matched_count || 0}
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Unmatched Source</div>
                  <div className="text-2xl font-bold">
                    {execution.summary.unmatched_source_count || 0}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Unmatched Target</div>
                  <div className="text-2xl font-bold">
                    {execution.summary.unmatched_target_count || 0}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Errors</div>
                  <div className="text-2xl font-bold">
                    {execution.summary.errors_count || 0}
                  </div>
                </div>
              </div>
              {execution.summary.accuracy_percentage !== null && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-1">Accuracy</div>
                  <div className="text-3xl font-bold text-green-600">
                    {execution.summary.accuracy_percentage?.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Errors</h3>
          <div className="max-h-48 overflow-y-auto">
            {errors.map((error, idx) => (
              <div key={idx} className="text-sm text-red-700 mb-1">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
        <div className="max-h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-1 text-gray-700">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
