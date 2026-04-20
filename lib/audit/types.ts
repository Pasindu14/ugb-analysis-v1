// lib/audit/types.ts

export type AuditMeta = {
  entity: string                                                     // domain name, e.g. 'users', 'employees'
  action: 'create' | 'update' | 'delete' | 'toggle_status' | 'change_password'
  actorId: number                                                    // integer user id — who performed the action
  companyId: number                                                  // tenant scope
  entityId?: string                                                  // PK of affected record (text supports uuid/bigserial future entities)
  changes?: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  }
}
