import React from 'react';

export function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;
}
