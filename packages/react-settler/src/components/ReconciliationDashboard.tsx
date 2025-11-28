/**
 * ReconciliationDashboard
 * Main wrapper component for reconciliation workflows
 */

import React, { ReactNode } from 'react';
import { CompilationProvider, CompilationProviderProps } from '../context';

export interface ReconciliationDashboardProps extends Omit<CompilationProviderProps, 'children'> {
  children: ReactNode;
  className?: string;
}

export function ReconciliationDashboard({
  children,
  mode,
  config,
  className
}: ReconciliationDashboardProps) {
  return (
    <CompilationProvider mode={mode} config={config}>
      <div className={className} data-reconciliation-dashboard>
        {children}
      </div>
    </CompilationProvider>
  );
}
