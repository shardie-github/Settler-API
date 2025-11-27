import React from 'react';

export function Badge({ children, className = '', variant }: { children: React.ReactNode; className?: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>{children}</span>;
}
