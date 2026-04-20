---
name: hris-feature-generator
description: >
  Generate a complete HRIS vertical slice feature — all 8 layers from database to UI.
  Use this skill whenever the user asks to create, add, scaffold, or build a new feature
  module (e.g. "create department feature", "add leave types", "build shift management",
  "scaffold attendance module"). This skill produces every file in the correct dependency
  order and validates with tsc. Even if the user just says "add X" or "create X" for any
  HRIS entity — trigger this skill.
---

# HRIS Feature Generator

Generate a complete vertical slice for the HRIS Next.js application. Every feature must
implement all layers in the correct order. The **users feature** at `features/users/` is
the canonical reference — always match its patterns exactly.

---

## Before You Write Any Code

**Step 1 — Fill in the template.**
Copy `template.md`, fill every section, and output it so the user can confirm before
you write a single file. Do not proceed until the plan is confirmed.

**Step 2 — Read existing patterns.**
```
Glob: features/*/                            ← see which features already exist
Read: features/users/                        ← read the complete users feature as reference
Read: db/schema.ts                           ← find the Drizzle table + inferred types
Read: lib/actions/wrapper.ts                 ← createAction({ name, requireAuth }, handler)
Read: lib/services/wrapper.ts                ← executeService({ context, method, logParams }, fn)
Read: lib/queries/wrapper.ts                 ← executeQuery({ context, method, logParams }, fn)
Read: lib/auth/helpers.ts                    ← getAuthUser() → { userId, companyId, role }
Read: lib/queries/pagination.ts              ← OffsetPagination, OffsetPaginatedResult helpers
Read: lib/audit/fire-audit.ts               ← fireAudit(meta) — non-blocking audit writes
Read: lib/hooks/use-error-toast.ts          ← handleErrorToast(error, resource, action)
Read: lib/types/actions.ts                  ← ActionResponse<T>, ActionFailure types
```

**Step 3 — Generate files in this exact order** (each layer depends on the layer below):

```
1. schemas/                      ← Zod DTOs + filter schema (no companyId, no id on create)
2. repositories/                 ← static class, Drizzle queries (executeQuery)
3. services/                     ← static class, business logic (executeService + fireAudit)
4. actions/                      ← single file, 'use server', createAction wrapper
5. store/                        ← dialog store (devtools), filter store, index.ts selectors
6. hooks/                        ← single file, 'use client', query keys + useQuery + useMutation
7. components/forms/             ← React Hook Form + Zod resolver
8. components/dialogs/           ← single combined dialogs file + any special dialogs
9. components/tables/            ← columns factory fn + table component
10. components/pages/            ← list page (table + dialogs)
11. app/(protected)/{module}s/   ← dynamic import page.tsx
```

**Step 4 — Validate.**
```bash
bash .claude/skills/hris-feature-generator/scripts/validate.sh {module}
```
Fix every TypeScript error before declaring done.

---

## Layer-by-Layer Patterns

Study `features/users/` for every detail. The notes below highlight the critical
rules that differ from what you might guess.

### 1 · schemas/{module}.schema.ts

- Export `createXSchema`, `updateXSchema`, `xFilterSchema` and their inferred types
- `updateXSchema` = `createXSchema.omit({ password: true }).partial().extend({ id: z.number().int().positive() })` or similar
- Never include `companyId`, `createdBy`, `updatedBy` — those are server-only
- Export all types as `type X = z.infer<typeof xSchema>`

```ts
import { z } from 'zod'

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
})

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.number().int().positive(),
})

export const departmentFilterSchema = z.object({
  search:   z.string().optional(),
  isActive: z.boolean().optional(),
})

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>
export type DepartmentFilterDto = z.infer<typeof departmentFilterSchema>
```

### 2 · repositories/{module}.repository.ts

- Static class named `{Entity}Repository`
- Every method: `executeQuery({ context: this.context, method: 'methodName', logParams: {...} }, async () => { ... })`
- Always accept `tx: DbTransaction = db` as last param for transaction support
- Use `ilike` (not `like`) for case-insensitive search (PostgreSQL)
- Count query: `` sql<number>`count(*)::int` ``
- Soft delete: `set({ isActive: false })` — NEVER `db.delete()`
- `findById` returns `Entity | null`, `create`/`update` return `Entity`, throw `NotFoundError` if `.returning()` is empty

```ts
import { db, type DbTransaction } from '@/db/drizzle'
import { eq, and, desc, sql, ilike } from 'drizzle-orm'
import { departmentsTable } from '@/db/schema'
import { executeQuery } from '@/lib/queries/wrapper'
import { NotFoundError } from '@/lib/errors'
import {
  getOffset, getTotalPages,
  type OffsetPagination, type OffsetPaginatedResult, DEFAULT_PAGE_SIZE,
} from '@/lib/queries/pagination'
import type { Department, DepartmentInsert, DepartmentUpdate } from '@/db/schema'

export type DepartmentFilters = { search?: string; isActive?: boolean }

export class DepartmentRepository {
  private static readonly context = 'DepartmentRepository'

  static async findById(companyId: number, id: number, tx: DbTransaction = db): Promise<Department | null> {
    return executeQuery(
      { context: this.context, method: 'findById', logParams: { id, companyId } },
      async () => {
        const result = await tx.select().from(departmentsTable)
          .where(and(eq(departmentsTable.companyId, companyId), eq(departmentsTable.id, id)))
          .limit(1)
        return result[0] ?? null
      }
    )
  }

  static async findAllPaginated(
    companyId: number,
    filters?: DepartmentFilters,
    pagination: OffsetPagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    tx: DbTransaction = db
  ): Promise<OffsetPaginatedResult<Department>> {
    return executeQuery(
      { context: this.context, method: 'findAllPaginated', logParams: { companyId, filters, ...pagination } },
      async () => {
        const { page, pageSize } = pagination
        const offset = getOffset(page, pageSize)
        const conditions = [eq(departmentsTable.companyId, companyId)]
        if (filters?.search) conditions.push(ilike(departmentsTable.name, `%${filters.search}%`))
        if (filters?.isActive !== undefined) conditions.push(eq(departmentsTable.isActive, filters.isActive))
        const whereClause = and(...conditions)
        const [countResult, items] = await Promise.all([
          tx.select({ count: sql<number>`count(*)::int` }).from(departmentsTable).where(whereClause),
          tx.select().from(departmentsTable).where(whereClause).orderBy(desc(departmentsTable.createdAt)).limit(pageSize).offset(offset),
        ])
        const total = countResult[0]?.count ?? 0
        return { items, total, page, pageSize, totalPages: getTotalPages(total, pageSize), hasMore: page < getTotalPages(total, pageSize) }
      }
    )
  }

  static async create(companyId: number, data: Omit<DepartmentInsert, 'companyId' | 'id' | 'createdAt'>, tx: DbTransaction = db): Promise<Department> {
    return executeQuery(
      { context: this.context, method: 'create', logParams: { companyId } },
      async () => {
        const result = await tx.insert(departmentsTable).values({ ...data, companyId }).returning()
        if (result.length === 0) throw new Error('Create failed')
        return result[0]
      }
    )
  }

  static async update(companyId: number, id: number, data: DepartmentUpdate, tx: DbTransaction = db): Promise<Department> {
    return executeQuery(
      { context: this.context, method: 'update', logParams: { id, companyId } },
      async () => {
        const result = await tx.update(departmentsTable).set(data)
          .where(and(eq(departmentsTable.companyId, companyId), eq(departmentsTable.id, id))).returning()
        if (result.length === 0) throw new NotFoundError(`Department ${id} not found`)
        return result[0]
      }
    )
  }

  static async softDelete(companyId: number, id: number, tx: DbTransaction = db): Promise<void> {
    return executeQuery(
      { context: this.context, method: 'softDelete', logParams: { id, companyId } },
      async () => {
        const result = await tx.update(departmentsTable).set({ isActive: false })
          .where(and(eq(departmentsTable.companyId, companyId), eq(departmentsTable.id, id)))
          .returning({ id: departmentsTable.id })
        if (result.length === 0) throw new NotFoundError(`Department ${id} not found`)
      }
    )
  }
}
```

### 3 · services/{module}.service.ts

- Static class named `{Entity}Service`
- Every method: `executeService({ context: this.context, method: 'methodName', logParams: {...} }, async () => { ... })`
- Mutating methods receive `actorId: number` as second param (from session, passed by action)
- Call `fireAudit(...)` non-blocking after every create/update/toggleStatus
- `getById` throws `NotFoundError` if null
- `toggleStatus` guards with `getById` before update

```ts
import { executeService } from '@/lib/services/wrapper'
import { NotFoundError, ConflictError } from '@/lib/errors'
import { DepartmentRepository } from '../repositories/department.repository'
import { fireAudit } from '@/lib/audit/fire-audit'
import type { CreateDepartmentDto, UpdateDepartmentDto, DepartmentFilterDto } from '../schemas/department.schema'
import type { Department } from '@/db/schema'
import type { OffsetPagination, OffsetPaginatedResult } from '@/lib/queries/pagination'

export class DepartmentService {
  private static readonly context = 'DepartmentService'

  static async getById(companyId: number, id: number): Promise<Department> {
    return executeService(
      { context: this.context, method: 'getById', logParams: { id, companyId } },
      async () => {
        const item = await DepartmentRepository.findById(companyId, id)
        if (!item) throw new NotFoundError(`Department ${id} not found`)
        return item
      }
    )
  }

  static async getAll(companyId: number, filters?: DepartmentFilterDto, pagination?: OffsetPagination): Promise<OffsetPaginatedResult<Department>> {
    return executeService(
      { context: this.context, method: 'getAll', logParams: { companyId } },
      async () => DepartmentRepository.findAllPaginated(companyId, filters, pagination)
    )
  }

  static async create(companyId: number, actorId: number, data: CreateDepartmentDto): Promise<Department> {
    return executeService(
      { context: this.context, method: 'create', logParams: { companyId } },
      async () => {
        // business rule: check uniqueness, validate refs, etc.
        const newItem = await DepartmentRepository.create(companyId, { ...data, isActive: true })
        fireAudit({ companyId, actorId, entity: 'departments', entityId: String(newItem.id), action: 'create', changes: { after: newItem } })
        return newItem
      }
    )
  }

  static async update(companyId: number, actorId: number, id: number, data: Omit<UpdateDepartmentDto, 'id'>): Promise<Department> {
    return executeService(
      { context: this.context, method: 'update', logParams: { id, companyId } },
      async () => {
        const old = await DepartmentRepository.findById(companyId, id)
        if (!old) throw new NotFoundError(`Department ${id} not found`)
        const updated = await DepartmentRepository.update(companyId, id, data)
        fireAudit({ companyId, actorId, entity: 'departments', entityId: String(id), action: 'update', changes: { before: old, after: updated } })
        return updated
      }
    )
  }

  static async toggleStatus(
    companyId: number,
    actorId: number,
    id: number,
    isActive: boolean
  ): Promise<Department> {
    return executeService(
      { context: this.context, method: 'toggleStatus', logParams: { id, companyId, isActive } },
      async () => {
        const old = await DepartmentRepository.findById(companyId, id)
        if (!old) throw new NotFoundError(`Department ${id} not found`)
        const updated = await DepartmentRepository.update(companyId, id, { isActive })
        fireAudit({ companyId, actorId, entity: 'departments', entityId: String(id), action: 'toggle_status', changes: { before: { isActive: old.isActive }, after: { isActive } } })
        return updated
      }
    )
  }
}
```

### 4 · actions/{module}.actions.ts

**Critical rules — these differ from older examples in this codebase:**

- `createAction({ name: 'xAction', requireAuth: true }, async (input) => { ... })` — the handler is the second arg, NOT a schema
- Call `getAuthUser()` **inside** the handler — there is NO optional `auth?: AuthContext` parameter
- Guard with `if (!companyId) throw new UnauthorizedError(...)`
- Pass `Number(userId)` as `actorId` to mutating service methods (`userId` from session is a string)
- No `revalidatePath` — TanStack Query handles cache invalidation
- All actions in ONE file per feature

```ts
'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { DepartmentService } from '@/features/department/services/department.service'
import {
  createDepartmentSchema, updateDepartmentSchema, departmentFilterSchema,
  type CreateDepartmentDto, type UpdateDepartmentDto, type DepartmentFilterDto,
} from '@/features/department/schemas/department.schema'
import type { OffsetPaginatedResult } from '@/lib/queries/pagination'
import type { Department } from '@/db/schema'

export const getDepartmentsAction = createAction(
  { name: 'getDepartmentsAction', requireAuth: true },
  async (input: { filters?: DepartmentFilterDto; page?: number; pageSize?: number }): Promise<OffsetPaginatedResult<Department>> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    const validatedFilters = departmentFilterSchema.safeParse(input.filters ?? {})
    const filters = validatedFilters.success ? validatedFilters.data : undefined
    return DepartmentService.getAll(companyId, filters, { page: input.page ?? 1, pageSize: input.pageSize ?? 20 })
  }
)

export const getDepartmentAction = createAction(
  { name: 'getDepartmentAction', requireAuth: true },
  async (id: number): Promise<Department> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    return DepartmentService.getById(companyId, id)
  }
)

export const createDepartmentAction = createAction(
  { name: 'createDepartmentAction', requireAuth: true },
  async (input: CreateDepartmentDto): Promise<Department> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    const validated = createDepartmentSchema.parse(input)
    return DepartmentService.create(companyId, Number(userId), validated)
  }
)

export const updateDepartmentAction = createAction(
  { name: 'updateDepartmentAction', requireAuth: true },
  async (input: UpdateDepartmentDto): Promise<Department> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    const validated = updateDepartmentSchema.parse(input)
    const { id, ...rest } = validated
    return DepartmentService.update(companyId, Number(userId), id, rest)
  }
)

// TOGGLE STATUS (activate / deactivate — no hard delete)

export const toggleDepartmentStatusAction = createAction(
  { name: 'toggleDepartmentStatusAction', requireAuth: true },
  async (input: { id: number; isActive: boolean }): Promise<Department> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    return DepartmentService.toggleStatus(companyId, Number(userId), input.id, input.isActive)
  }
)
```

### 5 · store/{module}-dialog.store.ts + store/index.ts

- Wrap store in `devtools(...)` middleware with `{ name: '{Entity}DialogStore' }`
- Separate `open{X}` and `close{X}` for each dialog (NOT a single `close()`)
- `selectedId` holds the entity id for edit/delete/confirm dialogs
- Separate `{module}-filter.store.ts` for search/pagination state (also wrapped in devtools)
- `store/index.ts`: export the raw store + selector hooks using `useShallow` from `'zustand/react/shallow'`

```ts
// store/department-dialog.store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DepartmentDialogState {
  isCreateOpen:     boolean
  isEditOpen:       boolean
  isActivateOpen:   boolean
  isDeactivateOpen: boolean
  selectedId:       number | null
  openCreate:     ()           => void
  closeCreate:    ()           => void
  openEdit:       (id: number) => void
  closeEdit:      ()           => void
  openActivate:   (id: number) => void
  closeActivate:  ()           => void
  openDeactivate: (id: number) => void
  closeDeactivate:()           => void
}

export const useDepartmentDialogStore = create<DepartmentDialogState>()(
  devtools(
    (set) => ({
      isCreateOpen:     false,
      isEditOpen:       false,
      isActivateOpen:   false,
      isDeactivateOpen: false,
      selectedId:       null,
      openCreate:     ()   => set({ isCreateOpen: true }),
      closeCreate:    ()   => set({ isCreateOpen: false }),
      openEdit:       (id) => set({ isEditOpen: true,       selectedId: id }),
      closeEdit:      ()   => set({ isEditOpen: false,      selectedId: null }),
      openActivate:   (id) => set({ isActivateOpen: true,   selectedId: id }),
      closeActivate:  ()   => set({ isActivateOpen: false,  selectedId: null }),
      openDeactivate: (id) => set({ isDeactivateOpen: true,  selectedId: id }),
      closeDeactivate:()   => set({ isDeactivateOpen: false, selectedId: null }),
    }),
    { name: 'DepartmentDialogStore' }
  )
)
```

```ts
// store/index.ts
import { useShallow } from 'zustand/react/shallow'
import { useDepartmentDialogStore } from './department-dialog.store'

export { useDepartmentDialogStore }

export const useCreateDialog = () =>
  useDepartmentDialogStore(useShallow((s) => ({ isOpen: s.isCreateOpen, open: s.openCreate, close: s.closeCreate })))

export const useEditDialog = () =>
  useDepartmentDialogStore(useShallow((s) => ({ isOpen: s.isEditOpen, selectedId: s.selectedId, open: s.openEdit, close: s.closeEdit })))

export const useActivateDialog = () =>
  useDepartmentDialogStore(useShallow((s) => ({ isOpen: s.isActivateOpen, selectedId: s.selectedId, open: s.openActivate, close: s.closeActivate })))

export const useDeactivateDialog = () =>
  useDepartmentDialogStore(useShallow((s) => ({ isOpen: s.isDeactivateOpen, selectedId: s.selectedId, open: s.openDeactivate, close: s.closeDeactivate })))
```

### 6 · hooks/{module}.hooks.ts  ← SINGLE FILE

All query keys, query hooks, and mutation hooks live in **one** `{module}.hooks.ts` file.

**Query key rules:**
- `all:` is a **plain array** — NOT a function: `all: ['departments'] as const`
- `lists:`, `details:` are plain arrays too
- `list:` and `detail:` are the only functions

**`useXDataTable` hook:**
- This is the hook passed as `fetchDataFn` to `<DataTable>` — must return `{ success, data, pagination }` shape
- Mark it with `(useXDataTable as unknown as Record<string, unknown>).isQueryHook = true`
- Use `keepPreviousData` for smooth pagination

**Mutation hooks:**
- Use `useState<Record<string, string> | null>(null)` for `fieldErrors` (create/update mutations)
- Check `result.success` and `throw result` if false (not `throw new Error(...)`)
- Use `handleErrorToast(error, 'department', 'create')` in `onError`
- Invalidate with `queryClient.invalidateQueries({ queryKey: departmentKeys.all })`
- Close dialog with `close()` from the selector hook

```ts
'use client'

import { useState } from 'react'
import { queryOptions, useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getDepartmentsAction, getDepartmentAction,
  createDepartmentAction, updateDepartmentAction, toggleDepartmentStatusAction,
} from '../actions/department.actions'
import { useCreateDialog, useEditDialog, useActivateDialog, useDeactivateDialog } from '../store'
import { handleErrorToast } from '@/lib/hooks/use-error-toast'
import type { ActionFailure } from '@/lib/types/actions'
import type { CreateDepartmentDto, UpdateDepartmentDto } from '../schemas/department.schema'

// --- Query key factory ---

export const departmentKeys = {
  all:     ['departments'] as const,
  lists:   ['departments', 'list'] as const,
  list:    (filters: object) => [...departmentKeys.lists, filters] as const,
  details: ['departments', 'detail'] as const,
  detail:  (id: number) => [...departmentKeys.details, id] as const,
}

// --- Query options factory ---

export function departmentQueryOptions(page: number, pageSize: number) {
  return queryOptions({
    queryKey: departmentKeys.list({ page, pageSize }),
    queryFn: async () => {
      const result = await getDepartmentsAction({ page, pageSize })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

// --- Query hooks ---

export function useDepartments(page: number, pageSize: number) {
  return useQuery(departmentQueryOptions(page, pageSize))
}

export function useDepartment(id: number | null) {
  return useQuery({
    queryKey: departmentKeys.detail(id!),
    queryFn: async () => {
      const result = await getDepartmentAction(id!)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: id !== null,
  })
}

// --- DataTable hook ---

export function useDepartmentDataTable(
  page: number,
  pageSize: number,
  search: string,
  _dateRange?: { from_date: string; to_date: string },
  _sortBy?: string,
  _sortOrder?: string,
  _caseConfig?: unknown,
  customFilters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: departmentKeys.list({ page, pageSize, search, customFilters }),
    queryFn: async () => {
      const status = customFilters?.status as string | undefined
      const isActive =
        status === 'active' ? true :
        status === 'inactive' ? false :
        undefined

      const result = await getDepartmentsAction({
        filters: { search: search || undefined, isActive },
        page,
        pageSize,
      })
      if (!result.success) throw new Error(result.error)
      const { items, total, page: p, pageSize: ps, totalPages } = result.data
      return {
        success: true as const,
        data: items,
        pagination: { page: p, limit: ps, total_pages: totalPages, total_items: total },
      }
    },
    placeholderData: keepPreviousData,
  })
}

;(useDepartmentDataTable as unknown as Record<string, unknown>).isQueryHook = true

// --- Mutation hooks ---

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  const { close } = useCreateDialog()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: CreateDepartmentDto) => {
      const result = await createDepartmentAction(data)
      if (!result.success) throw result
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      setFieldErrors(null)
      close()
      toast.success('Department created successfully')
    },
    onError: (error: ActionFailure) => {
      if (error.fields) setFieldErrors(error.fields)
      handleErrorToast(error, 'department', 'create')
    },
  })

  return { ...mutation, fieldErrors, clearFieldErrors: () => setFieldErrors(null) }
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  const { close } = useEditDialog()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<UpdateDepartmentDto, 'id'> }) => {
      const result = await updateDepartmentAction({ ...data, id })
      if (!result.success) throw result
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      setFieldErrors(null)
      close()
      toast.success('Department updated successfully')
    },
    onError: (error: ActionFailure) => {
      if (error.fields) setFieldErrors(error.fields)
      handleErrorToast(error, 'department', 'update')
    },
  })

  return { ...mutation, fieldErrors, clearFieldErrors: () => setFieldErrors(null) }
}

export function useActivateDepartment() {
  const queryClient = useQueryClient()
  const { close } = useActivateDialog()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await toggleDepartmentStatusAction({ id, isActive: true })
      if (!result.success) throw result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      close()
      toast.success('Department activated successfully')
    },
    onError: (error: ActionFailure) => {
      handleErrorToast(error, 'department', 'activate')
    },
  })
}

export function useDeactivateDepartment() {
  const queryClient = useQueryClient()
  const { close } = useDeactivateDialog()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await toggleDepartmentStatusAction({ id, isActive: false })
      if (!result.success) throw result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      close()
      toast.success('Department deactivated successfully')
    },
    onError: (error: ActionFailure) => {
      handleErrorToast(error, 'department', 'deactivate')
    },
  })
}
```

### 7 · components/forms/{module}-form.tsx

- `'use client'`
- `mode: 'create' | 'edit'` prop — controls which schema to use and button label
- `fieldErrors` prop with `useEffect` to `form.setError` for server-side validation feedback
- `clearFieldErrors` called on dialog close (passed from dialog parent)

### 8 · components/dialogs/{module}-dialogs.tsx  ← SINGLE FILE

- All dialogs in **one** file; named dialog functions (not exported); combined export e.g. `DepartmentDialogs`
- Create/Edit dialogs: `Dialog` with `clearFieldErrors()` on close
- Activate/Deactivate dialogs: two separate `AlertDialog` components — one to activate (`isActive: true`), one to deactivate (`isActive: false`); NO delete concept exists
- Edit dialog: fetch the entity with `useX(selectedId)` and show `<Spinner>` while loading
- Import from `'../../store'` (the index selectors), `'../../hooks/{module}.hooks'`, `'../forms/{module}-form'`

```tsx
'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { useCreateDialog, useEditDialog, useActivateDialog, useDeactivateDialog } from '../../store'
import { useCreateDepartment, useUpdateDepartment, useActivateDepartment, useDeactivateDepartment, useDepartment } from '../../hooks/department.hooks'
import { DepartmentForm } from '../forms/department-form'

function CreateDepartmentDialog() {
  const { isOpen, close } = useCreateDialog()
  const { mutate, isPending, fieldErrors, clearFieldErrors } = useCreateDepartment()
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { close(); clearFieldErrors() } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
          <DialogDescription>Add a new department to your company.</DialogDescription>
        </DialogHeader>
        <DepartmentForm mode="create" onSubmit={(data) => mutate(data)} isLoading={isPending} fieldErrors={fieldErrors} />
      </DialogContent>
    </Dialog>
  )
}

function EditDepartmentDialog() {
  const { isOpen, selectedId, close } = useEditDialog()
  const { data: department, isLoading: isLoadingDept } = useDepartment(selectedId)
  const { mutate, isPending, fieldErrors, clearFieldErrors } = useUpdateDepartment()
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { close(); clearFieldErrors() } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department details.</DialogDescription>
        </DialogHeader>
        {isLoadingDept ? (
          <div className="flex items-center justify-center py-8"><Spinner className="size-6" /></div>
        ) : (
          <DepartmentForm
            mode="edit"
            defaultValues={department ? { name: department.name } : undefined}
            onSubmit={(data) => { if (!selectedId) return; mutate({ id: selectedId, data }) }}
            isLoading={isPending}
            fieldErrors={fieldErrors}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ActivateDepartmentDialog() {
  const { isOpen, selectedId, close } = useActivateDialog()
  const { mutate, isPending } = useActivateDepartment()
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Department</AlertDialogTitle>
          <AlertDialogDescription>This will activate the department and make it visible to users.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => selectedId && mutate(selectedId)}
          >
            {isPending ? <Spinner className="mr-2" /> : null}
            Activate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeactivateDepartmentDialog() {
  const { isOpen, selectedId, close } = useDeactivateDialog()
  const { mutate, isPending } = useDeactivateDepartment()
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Department</AlertDialogTitle>
          <AlertDialogDescription>This will deactivate the department. It can be reactivated later.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => selectedId && mutate(selectedId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? <Spinner className="mr-2" /> : null}
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DepartmentDialogs() {
  return (
    <>
      <CreateDepartmentDialog />
      <EditDepartmentDialog />
      <ActivateDepartmentDialog />
      <DeactivateDepartmentDialog />
    </>
  )
}
```

### 9 · components/tables/{module}-columns.tsx + {module}-table.tsx

**Columns:** Use a **factory function** `get{Entity}Columns(actions)` — NOT a const array.
This is critical: calling Zustand hooks directly inside `cell` renderers causes React hook rule
violations. Instead, pass actions as props from the table component.

```tsx
// {module}-columns.tsx
'use client'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { MoreHorizontal, Edit, UserCheck, UserX } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Department } from '@/db/schema'

export interface DepartmentColumnActions {
  openEdit:       (id: number) => void
  openActivate:   (id: number) => void
  openDeactivate: (id: number) => void
}

export function getDepartmentColumns(actions: DepartmentColumnActions): ColumnDef<Department>[] {
  const { openEdit, openActivate, openDeactivate } = actions
  return [
    {
      accessorKey: 'name',
      size: 300,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'isActive',
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      size: 140,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue('createdAt')).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      size: 60,
      enableHiding: false,
      cell: ({ row }) => {
        const { id, isActive } = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(id)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isActive ? (
                <DropdownMenuItem onClick={() => openDeactivate(id)} className="text-destructive focus:text-destructive">
                  <UserX className="mr-2 h-4 w-4" /> Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => openActivate(id)}>
                  <UserCheck className="mr-2 h-4 w-4" /> Activate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
```

**Table component:**

```tsx
// {module}-table.tsx
'use client'
import { useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ExportableData } from '@/components/data-table/utils/export-utils'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useCreateDialog, useEditDialog, useActivateDialog, useDeactivateDialog } from '../../store'
import { useDepartmentDataTable } from '../../hooks/department.hooks'
import { getDepartmentColumns } from './department-columns'

export function DepartmentTable() {
  const { open: openCreate }     = useCreateDialog()
  const { open: openEdit }       = useEditDialog()
  const { open: openActivate }   = useActivateDialog()
  const { open: openDeactivate } = useDeactivateDialog()

  const getColumns = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_handleRowDeselection: ((rowId: string) => void) | null | undefined) =>
      getDepartmentColumns({ openEdit, openActivate, openDeactivate }) as ColumnDef<ExportableData>[],
    [openEdit, openActivate, openDeactivate],
  )

  return (
    <DataTable
      config={{
        enableRowSelection:   false,
        enableSearch:         true,
        enableDateFilter:     false,
        enableExport:         false,
        enableColumnResizing: false,
        enableUrlState:       false,
        searchPlaceholder:    'Search departments...',
      }}
      getColumns={getColumns}
      fetchDataFn={useDepartmentDataTable}
      exportConfig={{
        entityName: 'departments',
        columnMapping: { name: 'Name', isActive: 'Status', createdAt: 'Created At' },
        columnWidths: [{ wch: 30 }, { wch: 12 }, { wch: 20 }],
        headers: ['Name', 'Status', 'Created At'],
      }}
      idField="id"
      renderToolbarContent={() => (
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      )}
    />
  )
}
```

### 10 · components/pages/{module}-list-page.tsx

Simple composition. The page header is inside here; the "Add" button lives in the table toolbar.

```tsx
'use client'
import { DepartmentTable }   from '../tables/department-table'
import { DepartmentDialogs } from '../dialogs/department-dialogs'

export function DepartmentListPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between bg-muted/50 p-10 rounded-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Management</h1>
          <p className="text-muted-foreground">Manage your company departments</p>
        </div>
      </div>
      <DepartmentTable />
      <DepartmentDialogs />
    </div>
  )
}
```

### 11 · app/(protected)/{modules}/page.tsx

Dynamic import to avoid SSR issues with client-only table components.

```tsx
import dynamic from 'next/dynamic'

const DepartmentListPage = dynamic(
  () => import('@/features/department/components/pages/department-list-page').then(m => m.DepartmentListPage),
  { ssr: false }
)

export default function Page() {
  return <DepartmentListPage />
}
```

---

## File Structure Summary

```
features/{module}/
├── schemas/
│   └── {module}.schema.ts
├── repositories/
│   └── {module}.repository.ts
├── services/
│   └── {module}.service.ts
├── actions/
│   └── {module}.actions.ts          ← 'use server', all actions in one file
├── store/
│   ├── {module}-dialog.store.ts
│   ├── {module}-filter.store.ts     ← if needed
│   └── index.ts                     ← selector hooks via useShallow
├── hooks/
│   └── {module}.hooks.ts            ← 'use client', everything in one file
├── constants.ts                     ← if the feature has enums/labels (like users)
└── components/
    ├── forms/
    │   └── {module}-form.tsx
    ├── dialogs/
    │   └── {module}-dialogs.tsx     ← all dialogs in one combined file
    ├── tables/
    │   ├── {module}-columns.tsx     ← factory fn (not const array)
    │   └── {module}-table.tsx
    └── pages/
        └── {module}-list-page.tsx

app/(protected)/{modules}/
└── page.tsx                         ← dynamic import, ssr: false
```

---

## Never-Do Checklist (verify before finalising)

```
Never:  No companyId in any Zod schema
Never:  db.delete() — always softDelete (set isActive: false)
Never:  auth?: AuthContext optional param in actions — always getAuthUser() inside handler
Never:  revalidatePath — TanStack Query handles invalidation
Never:  queryKeys.all() as a function — it must be a plain array: ['entity'] as const
Never:  queryClient.invalidateQueries({ queryKey: entityKeys.all() }) — remove the ()
Never:  barrel import from actions/ — import from the specific file path
Never:  store server data in Zustand — only dialog/filter UI state
Never:  useShallow from 'zustand/shallow' — always 'zustand/react/shallow'
Never:  const columns array with hooks inside cell — use factory fn get{Entity}Columns(actions)
Never:  split hooks into query-keys / queries / mutations files — one file per feature
Never:  skip 'use server' on actions file
Never:  skip 'use client' on hooks / store / component files
Never:  skip executeQuery / executeService / createAction wrappers
Never:  omit fireAudit on create / update / toggleStatus service methods
```

---

## Reference files

- `examples/sample.md` — a complete worked example (Designation) showing old patterns for contrast
- `scripts/validate.sh` — run after generation to verify tsc passes and all layers exist
