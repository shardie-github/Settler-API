/**
 * useSecurity Hook
 * Security context and audit logging
 */

import { useCallback, useContext } from 'react';
import {
  SecurityContext,
  AuditEvent,
  AuditLogEntry
} from '@settler/protocol';
import { useCompilationContext } from '../context';

let auditLogHandler: ((entry: AuditLogEntry) => void) | null = null;

/**
 * Set audit log handler
 */
export function setAuditLogHandler(handler: (entry: AuditLogEntry) => void): void {
  auditLogHandler = handler;
}

/**
 * useSecurity Hook
 */
export function useSecurity() {
  const context = useCompilationContext();
  const securityContext = context.securityContext;

  const auditLog = useCallback((event: AuditEvent, action: string, result: 'success' | 'failure' | 'warning', metadata?: Record<string, unknown>) => {
    if (!auditLogHandler) {
      return;
    }

    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      event,
      userId: securityContext?.userId,
      sessionId: securityContext?.sessionId,
      ipAddress: securityContext?.ipAddress,
      userAgent: securityContext?.userAgent,
      action,
      result,
      metadata
    };

    auditLogHandler(entry);
  }, [securityContext]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!securityContext?.permissions) {
      return false;
    }
    return securityContext.permissions.includes(permission);
  }, [securityContext]);

  const hasRole = useCallback((role: string): boolean => {
    if (!securityContext?.roles) {
      return false;
    }
    return securityContext.roles.includes(role);
  }, [securityContext]);

  return {
    securityContext,
    auditLog,
    hasPermission,
    hasRole
  };
}
