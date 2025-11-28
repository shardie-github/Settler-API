/**
 * FilterBar Component
 * Advanced filtering for reconciliation data
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useCompilationContext } from '../context';
import { useTelemetry } from '../hooks/useTelemetry';

export interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
  className?: string;
  showProviderFilter?: boolean;
  showStatusFilter?: boolean;
  showDateRangeFilter?: boolean;
  showAmountRangeFilter?: boolean;
}

export interface FilterState {
  provider?: string[];
  status?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
  search?: string;
}

export function FilterBar({
  onFilterChange,
  className,
  showProviderFilter = true,
  showStatusFilter = true,
  showDateRangeFilter = true,
  showAmountRangeFilter = true
}: FilterBarProps) {
  const context = useCompilationContext();
  const { track } = useTelemetry('FilterBar');

  const [filters, setFilters] = useState<FilterState>({});

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    track('filter.changed', { filters: newFilters });
    onFilterChange?.(newFilters);
  }, [onFilterChange, track]);

  // In config mode, register widget
  if (context.mode === 'config') {
    if (!context.config.widgets) {
      context.config.widgets = {};
    }
    context.config.widgets['filter-bar'] = {
      id: 'filter-bar',
      type: 'filter-bar',
      props: {
        showProviderFilter,
        showStatusFilter,
        showDateRangeFilter,
        showAmountRangeFilter
      }
    };
    return null;
  }

  // UI mode
  return (
    <div className={className} data-widget="filter-bar">
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        {showProviderFilter && (
          <select
            value={filters.provider?.[0] || ''}
            onChange={(e) => {
              const provider = e.target.value ? [e.target.value] : undefined;
              handleFilterChange({ ...filters, provider });
            }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">All Providers</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="square">Square</option>
          </select>
        )}

        {showStatusFilter && (
          <select
            value={filters.status?.[0] || ''}
            onChange={(e) => {
              const status = e.target.value ? [e.target.value] : undefined;
              handleFilterChange({ ...filters, status });
            }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
          </select>
        )}

        {showDateRangeFilter && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => {
                handleFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value }
                });
              }}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <span>to</span>
            <input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => {
                handleFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value }
                });
              }}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
        )}

        {showAmountRangeFilter && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Min"
              value={filters.amountRange?.min || ''}
              onChange={(e) => {
                const min = e.target.value ? parseFloat(e.target.value) : undefined;
                handleFilterChange({
                  ...filters,
                  amountRange: { ...filters.amountRange, min }
                });
              }}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', width: '100px' }}
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.amountRange?.max || ''}
              onChange={(e) => {
                const max = e.target.value ? parseFloat(e.target.value) : undefined;
                handleFilterChange({
                  ...filters,
                  amountRange: { ...filters.amountRange, max }
                });
              }}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', width: '100px' }}
            />
          </div>
        )}

        <button
          onClick={() => {
            handleFilterChange({});
            track('filter.cleared');
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
