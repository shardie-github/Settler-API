import React from 'react';

export function Button({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false,
  variant,
  size
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'outline' | 'destructive' | 'default';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
