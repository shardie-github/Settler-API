/**
 * Code Block Component
 * Reusable code display component with syntax highlighting
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  return (
    <pre
      className={cn(
        'bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono',
        className
      )}
    >
      <code>{code}</code>
    </pre>
  );
}
