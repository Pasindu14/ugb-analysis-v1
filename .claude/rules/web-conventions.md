---
description: HRIS Next.js conventions — server actions, Drizzle, TanStack Query, Zustand, NextAuth, and import rules.
---

# Web Conventions — HRIS Next.js App

## Architecture: Vertical Slice

Each HRIS module lives in `features/{module}/` and owns its full stack. Every new feature must have all layers.

```
features/{module}/
  actions/       ← Next.js server actions using createAction wrapper
  repositories/  ← Drizzle queries using executeQuery wrapper
  services/      ← Business logic using executeService wrapper
  schemas/       ← Zod schemas + inferred TS types (shared client/server)
  hooks/         ← TanStack Query hooks (useQuery + useMutation)
  store/         ← Zustand UI state (dialog + filter stores)
  components/
    dialogs/     ← shadcn Dialog modals (Create, Update, Delete, Details)
    forms/       ← React Hook Form + Zod resolver forms
    tables/      ← TanStack Table column defs + table component
    pages/       ← Top-level page composed from table + dialogs
```

---

## Wrapper Functions (Mandatory)

### `createAction(schema, handler)` — server actions
```ts
// handler receives { input, session: { companyId, userId } }
export const createDepartment = createAction(createDepartmentSchema, async ({ input, session }) => {
  return departmentService.create({ ...input, companyId: session.companyId, createdBy: session.userId });
});
// Returns: ActionResult<T> = { success: true, data: T } | { success: false, error: string }
```

### `executeService(fn)` — service layer
```ts
export const departmentService = {
  create: (data) => executeService(async () => {
    // business logic here; throw AppError for domain errors
    return departmentRepository.create(data);
  }),
};
```

### `executeQuery(fn)` — repository layer
```ts
export const departmentRepository = {
  create: (data) => executeQuery(async () => {
    return db.insert(departments).values(data).returning();
  }),
};
```

---

## NextAuth v5 — Session Shape

Session carries `companyId` from JWT. Every server action receives it via `createAction`.

```ts
// Session shape
{ user: { id, name, email, role, companyId } }

// Access in server action handler
async ({ input, session }) => {
  const { companyId, userId } = session; // auto-extracted by createAction
}
```

**Never** accept `companyId` from the client — always use `session.companyId`.

---

## Drizzle ORM — Query Conventions

```ts
// Always scope queries to companyId
const result = await db.query.departments.findMany({
  where: and(eq(departments.companyId, companyId), eq(departments.isActive, true)),
});

// Soft delete — never use db.delete()
await db.update(departments)
  .set({ isActive: false, deletedAt: new Date(), updatedBy: userId })
  .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));

// Pagination
const [data, [{ count }]] = await Promise.all([
  db.query.employees.findMany({ where, limit: pageSize, offset: (page - 1) * pageSize }),
  db.select({ count: sql<number>`count(*)` }).from(employees).where(where),
]);
```

---

## TanStack Query v5 — Hooks Pattern

```ts
// Query key factory — plain arrays, not functions
export const departmentKeys = {
  all: ['departments'] as const,
  list: (filters: DepartmentFilters) => ['departments', 'list', filters] as const,
  detail: (id: string) => ['departments', 'detail', id] as const,
};

// Query hook
export const useDepartments = (filters: DepartmentFilters) => {
  return useQuery({
    queryKey: departmentKeys.list(filters),
    queryFn: () => getDepartments(filters),
  });
};

// Mutation hook
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const { close } = useCreateDialog();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      close();
      toast.success('Department created');
    },
    onError: (error) => useErrorToast(error),
  });
};
```

**Query key invalidation:** `queryClient.invalidateQueries({ queryKey: departmentKeys.all })` — no `()` on `.all`.

---

## Zustand v5 — Store Pattern

Two stores per feature: dialog store (modal state) and filter store (search/pagination).

```ts
// Dialog store
interface DepartmentDialogStore {
  isCreateOpen: boolean;
  isEditOpen: boolean;
  isDeleteOpen: boolean;
  selectedId: string | null;
  openCreate: () => void;
  openEdit: (id: string) => void;
  openDelete: (id: string) => void;
  close: () => void;
}

// Filter store
interface DepartmentFilterStore {
  search: string;
  page: number;
  pageSize: number;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
}

// Composite selector hooks using useShallow
export const useCreateDialog = () =>
  useDepartmentDialogStore(useShallow((s) => ({ isOpen: s.isCreateOpen, open: s.openCreate, close: s.close })));
```

---

## nuqs — URL State for Pagination & Filters

```ts
// Use nuqs for pagination + filter state that should survive page refresh
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
const [search, setSearch] = useQueryState('search', { defaultValue: '' });
const [pageSize] = useQueryState('pageSize', parseAsInteger.withDefault(20));
```

---

## Forms — React Hook Form + Zod

```ts
const form = useForm<CreateDepartmentInput>({
  resolver: zodResolver(createDepartmentSchema),
  defaultValues: { name: '', startDate: new Date() },
});

const { execute, fieldErrors } = useCreateDepartment();

// Map server-side field errors back to form
useEffect(() => {
  if (fieldErrors) {
    Object.entries(fieldErrors).forEach(([field, message]) => {
      form.setError(field as keyof CreateDepartmentInput, { message });
    });
  }
}, [fieldErrors]);
```

---

## Never-Do (Web-Specific)

```
Never:  import action in a component and call it directly
Always: call the action through a useMutation hook in features/{module}/hooks/

Never:  import { something } from '@/features/employee/actions'  (barrel export)
Always: import { createEmployee } from '@/features/employee/actions/create-employee.action'

Never:  accept companyId from form input or URL params
Always: companyId comes only from session inside createAction

Never:  all: () => ['departments'] as const   (function form)
Always: all: ['departments'] as const          (plain array)

Never:  queryClient.invalidateQueries({ queryKey: departmentKeys.all() })
Always: queryClient.invalidateQueries({ queryKey: departmentKeys.all })

Never:  import { useShallow } from 'zustand/shallow'
Always: import { useShallow } from 'zustand/react/shallow'

Never:  store server data in Zustand
Always: TanStack Query for server data; Zustand for dialog/filter UI state only

Never:  omit 'use client' from hooks files
Never:  write manual TypeScript types — always infer from Zod: type T = z.infer<typeof schema>
Never:  skip executeQuery / executeService / createAction wrappers
Never:  use db.delete() on business entities — always soft delete
```
