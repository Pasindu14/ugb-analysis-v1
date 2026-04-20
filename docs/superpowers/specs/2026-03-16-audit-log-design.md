# Audit Log System — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Scope:** Write-operation audit logging for all HRIS CRUD features, starting with Users.

---

## 1. Goals

- Record every mutating operation (create, update, delete, toggleStatus, changePassword) with full context.
- Store old/new value diffs for update-type operations.
- Identify the actor (who), the target (what), and the change (how) for every audit entry.
- Never block the primary operation if audit writing fails.
- Follow the existing vertical-slice architecture and wrapper patterns.

## 2. Non-Goals

- No UI for querying audit logs (DB-only for now).
- No read-operation auditing (GET requests are not logged).
- No IP address or user-agent capture.
- No audit log deletion or archival policy (out of scope).

---

## 3. Database Schema

Add `audit_logs` table to `db/schema.ts`.

```ts
export const auditLogsTable = pgTable('audit_logs', {
  id:        bigserial('id', { mode: 'number' }).primaryKey(),
  companyId: integer('company_id').notNull().references(() => companiesTable.id),
  actorId:   integer('actor_id').notNull(),   // FK to usersTable.id — who performed the action
  entity:    text('entity').notNull(),         // domain name e.g. 'users', 'employees'
  entityId:  text('entity_id'),               // nullable; stored as text to support uuid/bigserial future entities
  action:    text('action').notNull(),         // 'create' | 'update' | 'delete' | 'toggle_status' | 'change_password'
  changes:   jsonb('changes'),                 // { before?: object, after?: object }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type AuditLog       = typeof auditLogsTable.$inferSelect
export type AuditLogInsert = typeof auditLogsTable.$inferInsert
```

**`id` uses `bigserial`** — audit logs are a high-write, append-only table. `serial` (int4) overflows at ~2.1 billion rows; `bigserial` (int8) is safe for any realistic scale.

**Immutability — explicit exception to soft-delete rule:** `auditLogsTable` deliberately omits `isActive` / `deletedAt`. This is an intentional exception to the project-wide soft-delete convention. Audit logs must be immutable; adding a deletedAt column would allow records to be hidden, defeating the purpose of an audit trail. Never run `db.update()` or `db.delete()` on this table.

**`changes` field conventions:**

| Action | `changes` shape | Notes |
|---|---|---|
| `create` | `{ after: <new record> }` | No before. Omit secrets (passwordHash). |
| `update` | `{ before: <old record>, after: <new record> }` | Both snapshots. Omit secrets. |
| `delete` | `{ before: <old record snapshot> }` | No after (record is now inactive). |
| `toggle_status` | `{ before: { isActive }, after: { isActive } }` | Minimal diff. |
| `change_password` | `{ before: { id }, after: { id } }` | Records the event occurred for this user ID. No credential data ever logged — neither old nor new hash. |

---

## 4. Audit Log Repository

**File:** `lib/audit/audit-log.repository.ts`

Single responsibility: write an audit entry. No reads needed for now.

```ts
import { db } from '@/db/drizzle'
import { auditLogsTable, type AuditLogInsert } from '@/db/schema'
import { executeQuery } from '@/lib/queries/wrapper'

export class AuditLogRepository {
  static async create(data: AuditLogInsert): Promise<void> {
    return executeQuery(
      { context: 'AuditLogRepository', method: 'create' },
      async () => {
        await db.insert(auditLogsTable).values(data)
      }
    )
  }
}
```

---

## 5. Audit Metadata Type

**File:** `lib/audit/types.ts` — export `AuditMeta` type only. Do NOT add `audit` to `ServiceConfig` — see Section 6.

Placed in `lib/audit/` as shared cross-feature infrastructure — every feature's service layer will import from here.

```ts
export type AuditMeta = {
  entity: string
  action: 'create' | 'update' | 'delete' | 'toggle_status' | 'change_password'
  actorId: number
  companyId: number
  entityId?: string                                                  // text supports uuid/bigserial future entities
  changes?: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  }
}
```

---

## 6. Audit Write Location — Service Methods (not `executeService` wrapper)

Audit calls are made **explicitly inside each mutating service method**, not inside `executeService`. This keeps audit logic in the feature/domain layer where semantic context lives, and prevents coupling the shared infrastructure wrapper to a domain concern.

The pattern is:

```ts
static async create(companyId: number, actorId: number, data: CreateUserDto): Promise<UserSafe> {
  return executeService(
    { context: this.context, method: 'create', logParams: { companyId } },
    async () => {
      // ... business logic ...
      const newUser = await UserRepository.create(companyId, { ... })

      // Audit write — non-blocking, must not throw
      AuditLogRepository.create({
        companyId,
        actorId,
        entity: 'users',
        entityId: newUser.id,
        action: 'create',
        changes: { after: newUser },
      }).catch((err) => logger.error({ err }, 'Audit log write failed'))

      return newUser
    }
  )
}
```

**Non-blocking pattern:** The `.catch()` is scoped only to the `AuditLogRepository.create()` promise. The `executeService` handler's own errors still bubble normally — the try/catch in `executeService` is unaffected. The primary operation's result is already captured in `newUser` before the audit call fires. No primary operation can be rolled back by an audit failure.

---

## 7. Service Layer — actorId Threading

All mutating `UserService` methods gain `actorId: number` as the second parameter (after `companyId`). The service fetches a before-snapshot where needed.

### Method signatures

```ts
static async create(companyId: number, actorId: number, data: CreateUserDto): Promise<UserSafe>
static async update(companyId: number, actorId: number, id: number, data: Omit<UpdateUserDto, 'id'>): Promise<UserSafe>
static async changePassword(companyId: number, actorId: number, data: ChangePasswordDto): Promise<UserSafe>
static async toggleStatus(companyId: number, actorId: number, id: number, isActive: boolean): Promise<UserSafe>
static async delete(companyId: number, actorId: number, id: number): Promise<void>
```

### Diff strategy per method

| Method | Before snapshot | How |
|---|---|---|
| `create` | None | No fetch needed |
| `update` | `findById` before `update` | Adds one DB round-trip |
| `toggleStatus` | `findById` before `update` | Adds one DB round-trip |
| `delete` | `findById` before `softDelete` | Adds one DB round-trip |
| `changePassword` | None | Only log `{ before: { id }, after: { id } }` |

The extra `findById` calls on `update`, `toggleStatus`, and `delete` are intentional — they are the cost of a full before/after diff. They run inside the same `executeService` handler.

---

## 8. Action Layer — actorId from Session

Every mutating action already calls `getAuthUser()` once, which returns `{ userId: string, companyId: number, role: string }`. The same call provides both `companyId` and `actorId`.

**Type note:** `userId` from NextAuth session is a `string`. Cast to `number` with `Number(userId)` at the action layer before passing to the service. This matches `actorId: integer` in the DB schema.

```ts
export const createUserAction = createAction(
  { name: 'createUserAction', requireAuth: true },
  async (input: CreateUserDto) => {
    const { companyId, userId } = await getAuthUser()
    const validated = createUserSchema.parse(input)
    return UserService.create(companyId, Number(userId), validated)
  }
)
```

All other mutating actions (`updateUserAction`, `deleteUserAction`, `toggleUserStatusAction`, `changePasswordAction`) follow the same pattern — single `getAuthUser()` call, `Number(userId)` passed as `actorId`.

---

## 9. Industry Standards Applied

- **Immutable append-only log** — no updates or deletes on `audit_logs`.
- **Actor identity** — every entry records who performed the action via `actorId`.
- **Semantic action names** — human-readable strings, not numeric codes.
- **Before/after diffs** — full change context for forensic analysis.
- **Secret exclusion** — `passwordHash` and all credential fields are never written to `changes`.
- **Non-blocking** — audit failure must not cause the primary operation to fail or rollback.
- **Tenant-scoped** — every entry is scoped to `companyId` for multi-tenant isolation.
- **Timezone-aware timestamps** — `timestamptz` in PostgreSQL.
- **`bigserial` PK** — safe for high-volume append-only tables; `serial` (int4) would overflow at ~2.1B rows.

---

## 10. File Checklist

| File | Change |
|---|---|
| `db/schema.ts` | Add `auditLogsTable` with `bigserial` PK, export `AuditLog` and `AuditLogInsert` types |
| `lib/audit/types.ts` | Export `AuditMeta` type — placed in `lib/audit/` as shared cross-feature infrastructure |
| `lib/audit/audit-log.repository.ts` | `AuditLogRepository.create()` — placed in `lib/audit/` alongside types |
| `features/users/services/users.service.ts` | Add `actorId: number` to all mutating methods; add non-blocking audit call inside each handler; add `findById` before-snapshot where needed |
| `features/users/actions/users.actions.ts` | Destructure `userId` from `getAuthUser()`; pass `Number(userId)` as `actorId` to all mutating service calls |

---

## 11. Migration

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
