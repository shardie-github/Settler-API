import React from 'react';

export function Select({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) {
  return (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
  return <option value={value}>{children}</option>;
}
