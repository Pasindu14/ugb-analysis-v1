// lib/audit/audit-log.repository.ts

import { db } from '@/db/drizzle'
import { auditLogsTable } from '@/db/schema'
import { executeQuery } from '@/lib/queries/wrapper'
import type { AuditLogInsert } from '@/db/schema'

export class AuditLogRepository {
  private static readonly context = 'AuditLogRepository'

  static async create(data: AuditLogInsert): Promise<void> {
    return executeQuery(
      { context: this.context, method: 'create', logParams: { entity: data.entity, action: data.action, actorId: data.actorId } },
      async () => {
        await db.insert(auditLogsTable).values(data)
      }
    )
  }
}
