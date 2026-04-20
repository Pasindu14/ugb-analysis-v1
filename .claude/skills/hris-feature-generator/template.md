# Feature Plan — {FeatureName}

> Fill every section before generating any code. Output this plan and wait for user confirmation.

---

## 1. Entity Summary

| Field         | Value                                               |
| ------------- | --------------------------------------------------- |
| Module name   | `{module}` (e.g. `department`)                      |
| Entity name   | `{Entity}` (e.g. `Department`)                      |
| Plural        | `{Entities}` (e.g. `Departments`)                   |
| Route         | `app/(protected)/{modules}/page.tsx`                |
| Drizzle table | `{tableName}` from `db/schema.ts`                   |
| Schema types  | `{Entity}`, `{Entity}Insert`, `{Entity}Update`      |
| Relates to    | e.g. `companiesTable`, referenced by employees      |

---

## 2. Schema Fields

List every field that appears in the **create form**. Exclude auto-managed columns
(`id`, `companyId`, `createdBy`, `updatedBy`, `isActive`, `createdAt`, `updatedAt`).

| Field name | Drizzle type | Zod validator         | Required? | Notes |
| ---------- | ------------ | --------------------- | --------- | ----- |
| name       | text         | z.string().min(1)     | Yes       |       |
| ...        |              |                       |           |       |

**Update schema differences** (fields excluded or made optional vs. create):
- `id` added as `z.number().int().positive()`
- e.g. `password` excluded in update

---

## 3. Business Rules

Document every rule the service layer must enforce:

- [ ] e.g. Name must be unique per company (check with `findByName` before create)
- [ ] e.g. Cannot delete if referenced by active employees (check FK before softDelete)
- [ ] e.g. Setting resignationDate auto-sets status to inactive

Cross-feature dependencies (services or repositories this feature needs to call):
- e.g. `EmployeeRepository.findById` to validate employee exists before assignment

---

## 4. Table Columns

Columns visible in the TanStack Table:

| Header  | accessorKey / id | Cell renderer             |
| ------- | ---------------- | ------------------------- |
| Name    | `name`           | plain text / font-medium  |
| Status  | `isActive`       | Badge (Active / Inactive) |
| Created | `createdAt`      | `toLocaleDateString()`    |
| —       | `actions`        | DropdownMenu              |

---

## 5. Dialogs

| Dialog     | Type        | Title              | Submit label |
| ---------- | ----------- | ------------------ | ------------ |
| Create     | Dialog      | Create {Entity}    | Save         |
| Edit       | Dialog      | Edit {Entity}      | Save         |
| Activate   | AlertDialog | Activate {Entity}  | Activate     |
| Deactivate | AlertDialog | Deactivate {Entity}| Deactivate   |

Extra dialogs (if any — e.g. Change Password, Assign Role):
- ...

---

## 6. Actions Required

| Action function name      | Input type           | Returns                       |
| ------------------------- | -------------------- | ----------------------------- |
| `get{Entities}Action`     | filters + pagination | `OffsetPaginatedResult<{Entity}>` |
| `get{Entity}Action`       | `id: number`         | `{Entity}`                    |
| `create{Entity}Action`    | `Create{Entity}Dto`  | `{Entity}`                    |
| `update{Entity}Action`    | `Update{Entity}Dto`  | `{Entity}`                    |
| `delete{Entity}Action`    | `id: number`         | `void`                        |

---

## 7. Files to Generate

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
│   ├── {module}-filter.store.ts     ← only if filter state is needed
│   └── index.ts                     ← selector hooks via useShallow
├── hooks/
│   └── {module}.hooks.ts            ← 'use client', query keys + queries + mutations
├── constants.ts                     ← only if feature has enum labels/variants
└── components/
    ├── forms/
    │   └── {module}-form.tsx
    ├── dialogs/
    │   └── {module}-dialogs.tsx     ← all dialogs combined; extra dialogs as separate files
    ├── tables/
    │   ├── {module}-columns.tsx     ← factory fn get{Entity}Columns(actions)
    │   └── {module}-table.tsx
    └── pages/
        └── {module}-list-page.tsx

app/(protected)/{modules}/
└── page.tsx                         ← dynamic import ssr: false
```

Total files: ~12–17 depending on number of dialogs and whether constants/filter store are needed.

---

## 8. Quality Checklist (pre-flight)

- [ ] All layers listed above are present
- [ ] No `companyId` in any Zod schema (comes from session)
- [ ] No `db.delete()` — only `softDelete` (set `isActive: false`)
- [ ] Actions use `getAuthUser()` inside handler — no `auth?:` optional param
- [ ] No `revalidatePath` in actions — TanStack Query handles invalidation
- [ ] `all:` query key is a plain array, not a function
- [ ] `queryClient.invalidateQueries({ queryKey: entityKeys.all })` — no `()` on `.all`
- [ ] All action files have `'use server'`
- [ ] All hook/store/component files have `'use client'`
- [ ] `dynamic(..., { ssr: false })` on app route page
- [ ] Columns use factory fn `get{Entity}Columns(actions)` — not a const array
- [ ] Hooks in one file `{module}.hooks.ts` — not split into separate files
- [ ] `useShallow` imported from `'zustand/react/shallow'`
- [ ] `fireAudit(...)` called after create / update / toggleStatus in service
- [ ] No Delete dialog — use Activate + Deactivate AlertDialogs (toggle `isActive`)
- [ ] `npx tsc --noEmit` passes after generation
