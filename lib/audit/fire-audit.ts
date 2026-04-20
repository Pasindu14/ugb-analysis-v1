// lib/audit/fire-audit.ts

import { logger } from '@/lib/logger'
import { AuditLogRepository } from './audit-log.repository'
import type { AuditMeta } from './types'

/**
 * Dispatches an audit log entry non-blocking.
 * Audit failure must never affect the primary operation.
 */
export function fireAudit(meta: AuditMeta): void {
  AuditLogRepository.create({ ...meta, changes: meta.changes as unknown })
    .catch((err) => logger.error({ err }, 'Audit log write failed'))
}
