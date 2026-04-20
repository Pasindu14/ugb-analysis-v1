# Example: Department Feature

A simple HRIS feature — name + company scoping. Use this as the baseline pattern
for any new feature. It mirrors the **users feature** patterns exactly, simplified
to the minimal case.

---

## Filled Template (Plan — shown to user before generating)

| Field         | Value                                         |
|---------------|-----------------------------------------------|
| Module name   | `department`                                  |
| Entity name   | `Department`                                  |
| Plural        | `Departments`                                 |
| Route         | `app/(protected)/departments/page.tsx`        |
| Drizzle table | `departmentsTable` from `db/schema.ts`        |
| Schema types  | `Department`, `DepartmentInsert`, `DepartmentUpdate` |
| Relates to    | `companiesTable`, referenced by employees     |

**Schema fields (create form):**

| Field | Drizzle type | Zod validator          | Required? |
|-------|-------------|------------------------|-----------|
| name  | text        | z.string().min(1).max(255) | Yes   |

**Business rules:**
- Name must be unique per company (ConflictError in service)
- No hard delete — toggle isActive via Activate / Deactivate

**Table columns:** Name, Status, Created, Actions (Edit, Activate/Deactivate)

**Dialogs:** Create (Dialog), Edit (Dialog), Activate (AlertDialog), Deactivate (AlertDialog)

---

## Generated Files

### `features/department/schemas/department.schema.ts`

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

---

### `features/department/repositories/department.repository.ts`

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

export type DepartmentFilters = {
  search?:   string
  isActive?: boolean
}

export class DepartmentRepository {
  private static readonly context = 'DepartmentRepository'

  static async findById(
    companyId: number,
    id: number,
    tx: DbTransaction = db
  ): Promise<Department | null> {
    return executeQuery(
      { context: this.context, method: 'findById', logParams: { id, companyId } },
      async () => {
        const result = await tx
          .select()
          .from(departmentsTable)
          .where(and(eq(departmentsTable.companyId, companyId), eq(departmentsTable.id, id)))
          .limit(1)
        return result[0] ?? null
      }
    )
  }

  static async findByName(
    companyId: number,
    name: string,
    tx: DbTransaction = db
  ): Promise<Department | null> {
    return executeQuery(
      { context: this.context, method: 'findByName', logParams: { companyId } },
      async () => {
        const result = await tx
          .select()
          .from(departmentsTable)
          .where(and(eq(departmentsTable.companyId, companyId), eq(departmentsTable.name, name)))
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
        if (filters?.search)  conditions.push(ilike(departmentsTable.name, `%${filters.search}%`))
        if (filters?.isActive !== undefined) conditions.push(eq(departmentsTable.isActive, filters.isActive))

        const whereClause = and(...conditions)

        const [countResult, items] = await Promise.all([
          tx.select({ count: sql<number>`count(*)::int` }).from(departmentsTable).where(whereClause),
          tx.select().from(departmentsTable).where(whereClause).orderBy(desc(departmentsTable.createdAt)).limit(pageSize).offset(offset),
        ])

        const total      = countResult[0]?.count ?? 0
        const totalPages = getTotalPages(total, pageSize)

        return { items, total, page, pageSize, totalPages, hasMore: page < totalPages }
      }
    )
  }

  static async create(
    companyId: number,
    data: Omit<DepartmentInsert, 'companyId' | 'id' | 'createdAt'>,
    tx: DbTransaction = db
  ): Promise<Department> {
    return executeQuery(
      { context: this.context, method: 'create', logParams: { companyId } },
      async () => {
        const result = await tx.insert(departmentsTable).values({ ...data, companyId }).returning()
        if (result.length === 0) throw new Error('Create failed')
        return result[0]
      }
    )
  }

  static async update(
    companyId: number,
    id: number,
    data: DepartmentUpdate,
    tx: DbTransaction = db
  ): Promise<Department> {
    return executeQuery(
      { context: this.context, method: 'update', logParams: { id, companyId } },
      async () => {
        const result = await tx
          .update(departmentsTable).set(data)
          .where(and(eq(departmentsTable.companyId, companyId), eq(departmentsTable.id, id)))
          .returning()
        if (result.length === 0) throw new NotFoundError(`Department ${id} not found`)
        return result[0]
      }
    )
  }

  static async softDelete(
    companyId: number,
    id: number,
    tx: DbTransaction = db
  ): Promise<void> {
    return executeQuery(
      { context: this.context, method: 'softDelete', logParams: { id, companyId } },
      async () => {
        const result = await tx
          .update(departmentsTable).set({ isActive: false })
          .where(and(eq(departmentsTable.companyId, companyId), eq(departmentsTable.id, id)))
          .returning({ id: departmentsTable.id })
        if (result.length === 0) throw new NotFoundError(`Department ${id} not found`)
      }
    )
  }
}
```

---

### `features/department/services/department.service.ts`

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

  static async getAll(
    companyId: number,
    filters?: DepartmentFilterDto,
    pagination?: OffsetPagination
  ): Promise<OffsetPaginatedResult<Department>> {
    return executeService(
      { context: this.context, method: 'getAll', logParams: { companyId } },
      async () => DepartmentRepository.findAllPaginated(companyId, filters, pagination)
    )
  }

  static async create(
    companyId: number,
    actorId: number,
    data: CreateDepartmentDto
  ): Promise<Department> {
    return executeService(
      { context: this.context, method: 'create', logParams: { companyId } },
      async () => {
        const existing = await DepartmentRepository.findByName(companyId, data.name)
        if (existing) throw new ConflictError('A department with this name already exists')

        const newItem = await DepartmentRepository.create(companyId, { ...data, isActive: true })

        fireAudit({ companyId, actorId, entity: 'departments', entityId: String(newItem.id), action: 'create', changes: { after: newItem } })

        return newItem
      }
    )
  }

  static async update(
    companyId: number,
    actorId: number,
    id: number,
    data: Omit<UpdateDepartmentDto, 'id'>
  ): Promise<Department> {
    return executeService(
      { context: this.context, method: 'update', logParams: { id, companyId } },
      async () => {
        const old = await DepartmentRepository.findById(companyId, id)
        if (!old) throw new NotFoundError(`Department ${id} not found`)

        if (data.name && data.name !== old.name) {
          const conflict = await DepartmentRepository.findByName(companyId, data.name)
          if (conflict) throw new ConflictError('A department with this name already exists')
        }

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

---

### `features/department/actions/department.actions.ts`

```ts
'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { DepartmentService } from '@/features/department/services/department.service'
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentFilterSchema,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
  type DepartmentFilterDto,
} from '@/features/department/schemas/department.schema'
import type { OffsetPaginatedResult } from '@/lib/queries/pagination'
import type { Department } from '@/db/schema'

// READ — list

export const getDepartmentsAction = createAction(
  { name: 'getDepartmentsAction', requireAuth: true },
  async (input: { filters?: DepartmentFilterDto; page?: number; pageSize?: number }): Promise<OffsetPaginatedResult<Department>> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validatedFilters = departmentFilterSchema.safeParse(input.filters ?? {})
    const filters = validatedFilters.success ? validatedFilters.data : undefined

    return DepartmentService.getAll(companyId, filters, {
      page:     input.page     ?? 1,
      pageSize: input.pageSize ?? 20,
    })
  }
)

// READ — single

export const getDepartmentAction = createAction(
  { name: 'getDepartmentAction', requireAuth: true },
  async (id: number): Promise<Department> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    return DepartmentService.getById(companyId, id)
  }
)

// CREATE

export const createDepartmentAction = createAction(
  { name: 'createDepartmentAction', requireAuth: true },
  async (input: CreateDepartmentDto): Promise<Department> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validated = createDepartmentSchema.parse(input)
    return DepartmentService.create(companyId, Number(userId), validated)
  }
)

// UPDATE

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

---

### `features/department/store/department-dialog.store.ts`

```ts
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

### `features/department/store/index.ts`

```ts
import { useShallow } from 'zustand/react/shallow'
import { useDepartmentDialogStore } from './department-dialog.store'

export { useDepartmentDialogStore }

export const useCreateDialog = () =>
  useDepartmentDialogStore(
    useShallow((s) => ({ isOpen: s.isCreateOpen, open: s.openCreate, close: s.closeCreate }))
  )

export const useEditDialog = () =>
  useDepartmentDialogStore(
    useShallow((s) => ({ isOpen: s.isEditOpen, selectedId: s.selectedId, open: s.openEdit, close: s.closeEdit }))
  )

export const useActivateDialog = () =>
  useDepartmentDialogStore(
    useShallow((s) => ({ isOpen: s.isActivateOpen, selectedId: s.selectedId, open: s.openActivate, close: s.closeActivate }))
  )

export const useDeactivateDialog = () =>
  useDepartmentDialogStore(
    useShallow((s) => ({ isOpen: s.isDeactivateOpen, selectedId: s.selectedId, open: s.openDeactivate, close: s.closeDeactivate }))
  )
```

---

### `features/department/hooks/department.hooks.ts`

```ts
'use client'

import { useState } from 'react'
import { queryOptions, useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getDepartmentsAction,
  getDepartmentAction,
  createDepartmentAction,
  updateDepartmentAction,
  toggleDepartmentStatusAction,
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
        pagination: {
          page:        p,
          limit:       ps,
          total_pages: totalPages,
          total_items: total,
        },
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

---

### `features/department/components/forms/department-form.tsx`

```tsx
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDepartmentSchema, updateDepartmentSchema } from '../../schemas/department.schema'
import type { CreateDepartmentDto } from '../../schemas/department.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Spinner } from '@/components/ui/spinner'

const updateFormSchema = updateDepartmentSchema.omit({ id: true })

interface DepartmentFormProps {
  mode:           'create' | 'edit'
  defaultValues?: Partial<CreateDepartmentDto>
  onSubmit:       (data: CreateDepartmentDto) => void
  isLoading:      boolean
  fieldErrors?:   Record<string, string> | null
}

export function DepartmentForm({
  mode, defaultValues, onSubmit, isLoading, fieldErrors,
}: DepartmentFormProps) {
  const schema = mode === 'create' ? createDepartmentSchema : updateFormSchema

  const form = useForm<CreateDepartmentDto>({
    resolver:      zodResolver(schema as typeof createDepartmentSchema),
    defaultValues: { name: '', ...defaultValues },
  })

  const { setError } = form

  useEffect(() => {
    if (fieldErrors) {
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof CreateDepartmentDto, { message })
      })
    }
  }, [fieldErrors, setError])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Engineering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Spinner className="mr-2" />
          ) : mode === 'create' ? (
            'Create Department'
          ) : (
            'Update Department'
          )}
        </Button>
      </form>
    </Form>
  )
}
```

---

### `features/department/components/dialogs/department-dialogs.tsx`

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
import {
  useCreateDepartment, useUpdateDepartment,
  useActivateDepartment, useDeactivateDepartment, useDepartment,
} from '../../hooks/department.hooks'
import { DepartmentForm } from '../forms/department-form'

// --- Create Dialog ---

function CreateDepartmentDialog() {
  const { isOpen, close } = useCreateDialog()
  const { mutate, isPending, fieldErrors, clearFieldErrors } = useCreateDepartment()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) { close(); clearFieldErrors() }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
          <DialogDescription>Add a new department to your company.</DialogDescription>
        </DialogHeader>
        <DepartmentForm
          mode="create"
          onSubmit={(data) => mutate(data)}
          isLoading={isPending}
          fieldErrors={fieldErrors}
        />
      </DialogContent>
    </Dialog>
  )
}

// --- Edit Dialog ---

function EditDepartmentDialog() {
  const { isOpen, selectedId, close } = useEditDialog()
  const { data: department, isLoading: isLoadingDept } = useDepartment(selectedId)
  const { mutate, isPending, fieldErrors, clearFieldErrors } = useUpdateDepartment()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) { close(); clearFieldErrors() }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department details.</DialogDescription>
        </DialogHeader>
        {isLoadingDept ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : (
          <DepartmentForm
            mode="edit"
            defaultValues={department ? { name: department.name } : undefined}
            onSubmit={(data) => {
              if (!selectedId) return
              mutate({ id: selectedId, data })
            }}
            isLoading={isPending}
            fieldErrors={fieldErrors}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- Activate Dialog ---

function ActivateDepartmentDialog() {
  const { isOpen, selectedId, close } = useActivateDialog()
  const { mutate, isPending } = useActivateDepartment()

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Department</AlertDialogTitle>
          <AlertDialogDescription>
            This department will become active and visible across the system.
          </AlertDialogDescription>
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

// --- Deactivate Dialog ---

function DeactivateDepartmentDialog() {
  const { isOpen, selectedId, close } = useDeactivateDialog()
  const { mutate, isPending } = useDeactivateDepartment()

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Department</AlertDialogTitle>
          <AlertDialogDescription>
            This department will be hidden from the system. No data will be lost.
          </AlertDialogDescription>
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

// --- Combined export ---

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

---

### `features/department/components/tables/department-columns.tsx`

```tsx
'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { MoreHorizontal, Edit, UserCheck, UserX } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
      size:        300,
      header:      ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'isActive',
      size:        100,
      header:      ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      size:        140,
      header:      ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue('createdAt')).toLocaleDateString()}
        </div>
      ),
    },
    {
      id:           'actions',
      size:         60,
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
                <DropdownMenuItem
                  onClick={() => openDeactivate(id)}
                  className="text-destructive focus:text-destructive"
                >
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

### `features/department/components/tables/department-table.tsx`

```tsx
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
  const { open: openCreate }      = useCreateDialog()
  const { open: openEdit }        = useEditDialog()
  const { open: openActivate }    = useActivateDialog()
  const { open: openDeactivate }  = useDeactivateDialog()

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
        columnMapping: {
          name:      'Name',
          isActive:  'Status',
          createdAt: 'Created At',
        },
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

---

### `features/department/components/pages/department-list-page.tsx`

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

---

### `app/(protected)/departments/page.tsx`

```tsx
import dynamic from 'next/dynamic'

const DepartmentListPage = dynamic(
  () => import('@/features/department/components/pages/department-list-page')
    .then(m => m.DepartmentListPage),
  { ssr: false }
)

export default function Page() {
  return <DepartmentListPage />
}
```

---

## Final File Count

| Layer        | Files                                              |
|--------------|----------------------------------------------------|
| schemas      | 1                                                  |
| repositories | 1                                                  |
| services     | 1                                                  |
| actions      | 1 (all actions in one file)                        |
| store        | 2 (dialog store + index with selectors)            |
| hooks        | 1 (all hooks in one file)                          |
| components   | 6 (form × 1, dialogs × 1, columns × 1, table × 1, page × 1) |
| app route    | 1                                                  |
| **Total**    | **14**                                             |
