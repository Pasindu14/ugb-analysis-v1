# Build Feature Workflow

Scaffolds a complete Next.js feature from scratch. Builds every layer in strict order: schema → repository → service → actions → hooks → store → components. Complete and verify each layer before starting the next.

---

## Step 1 — Gather Information

Ask the user before writing anything:

1. **Feature name** — e.g. category, product, supplier
2. **Drizzle table** — does it exist in `@/db/schema`? If no — stop and tell user to create it first
3. **Soft delete pattern** — `deletedAt` timestamp or `isActive` boolean?
4. **Foreign keys** — does this feature reference another feature?
5. **Extra filters** — any filters beyond `search` and `isActive`?

Do not proceed until all five are answered.

---

## Step 2 — Read Required Files

Read in this order before writing anything:
1. `AGENTS.md` — source of truth for all conventions
2. The Drizzle table definition from `@/db/schema`
3. `@/lib/actions/wrapper.ts`
4. `@/lib/services/wrapper.ts`
5. `@/lib/queries/wrapper.ts`
6. `@/lib/auth/helpers.ts`
7. `@/lib/types/actions.ts`
8. `@/lib/queries/pagination.ts`

Confirm: "I have read all required files and am ready to build {featureName}."

---

## Step 3 — Create Folder Structure

Create all folders first. No files yet.

```
features/{feature}/
├── actions/
├── components/dialogs/ forms/ tables/ pages/
├── hooks/
├── repositories/
├── schemas/
├── services/
└── store/
```

---

## Step 4 — Schema Layer

Invoke `@nextjs-feature-schema`.

File: `features/{feature}/schemas/{feature}.schema.ts`

Verify before moving on:
- [ ] `createSchema` — no audit fields, no id, no companyId
- [ ] `CreateDto` inferred with `z.infer`
- [ ] `updateSchema` uses `.partial().extend({ id: z.number() })`
- [ ] `UpdateDto` inferred with `z.infer`
- [ ] `filterSchema` with search, isActive, page, pageSize, sortBy, sortOrder
- [ ] `FilterDto` inferred with `z.infer`
- [ ] Entity type re-exported from `@/db/schema`
- [ ] No barrel file

---

## Step 5 — Repository Layer

Invoke `@nextjs-feature-repository`.

Files: `{feature}.repository.ts` + `index.ts`

Verify before moving on:
- [ ] `FeatureFilters` type exported at top
- [ ] Class `{Feature}Repository` with `private static readonly context`
- [ ] `findById` — `T | null`, companyId scoped, soft delete filtered
- [ ] `findAllPaginated` — `Promise.all` for count + items
- [ ] `findAllCursor` — fetches `limit + 1`, pops last
- [ ] `findByIds` — `inArray`, guards empty array
- [ ] `getOptions` — `id` and `name` only, `isActive: true`, ordered by name
- [ ] `create` — `Omit` removes audit fields, injects companyId, `.returning()`
- [ ] `update` — injects `updatedAt: new Date()`, `.returning()`
- [ ] `softDelete` — correct pattern for this table, injects `updatedAt`
- [ ] `count` and `exists` present
- [ ] Every method has `tx: DbTransaction = db` as last param
- [ ] `executeQuery` on every method — no manual try/catch
- [ ] Barrel exports class and `FeatureFilters`

---

## Step 6 — Service Layer

Invoke `@nextjs-feature-service`.

Files: `{feature}.service.ts` + `index.ts`

Verify before moving on:
- [ ] Class `{Feature}Service` with `private static readonly context`
- [ ] `getById` — throws `NotFoundError` if null, returns `T` never `T | null`
- [ ] `getAll` and `getOptions` — thin pass-throughs
- [ ] `create` — data type `CreateDto & { createdBy: string }`, conflict check first
- [ ] `update` — data type `UpdateDto & { updatedBy: string }`, calls `this.getById` first
- [ ] `delete` — calls `this.getById` first, then `softDelete`
- [ ] `generateSlug` private static if feature uses slugs
- [ ] `executeService` on every method — no manual try/catch
- [ ] Never calls `getAuthUser()` — never touches another feature's repo or service
- [ ] Barrel exports class only

---

## Step 7 — Actions Layer

Invoke `@nextjs-feature-actions`.

File: `features/{feature}/actions/{feature}.actions.ts`

Verify before moving on:
- [ ] `'use server'` is the very first line
- [ ] `AuthContext = { companyId: number; userId: string }` defined at top
- [ ] `getFeatureAction` — companyId only from auth
- [ ] `getFeaturesAction` — `safeParse` for filters, page + pageSize at top level
- [ ] `getFeatureOptionsAction` — input is `void`
- [ ] `createFeatureAction` — `.parse()`, injects `createdBy: userId`, `revalidatePath`
- [ ] `updateFeatureAction` — `.parse()`, destructures `id`, injects `updatedBy: userId`, `revalidatePath`
- [ ] `deleteFeatureAction` — `id: number`, `revalidatePath`
- [ ] Every action has `requireAuth: true` and `auth?: AuthContext`
- [ ] Every action calls `auth ?? await getAuthUser()` as first line
- [ ] No barrel file

---

## Step 8 — Hooks Layer

Invoke `@nextjs-feature-hooks`.

Files: `{feature}.query-keys.ts` + `use-{feature}.queries.ts` + `use-{feature}.mutations.ts` + `index.ts`

Verify before moving on:
- [ ] Query keys: `all`, `lists`, `list`, `details`, `detail`, `dataTable`, `options`
- [ ] `useFeature(id)` — `enabled: !!id`, `staleTime: 30_000`
- [ ] `useFeatureDataTable` — IS a hook (uses `useQuery`), has `.isQueryHook = true` set after declaration
- [ ] `useFeatureDataTable` — has `placeholderData: keepPreviousData` and `staleTime: 30_000`
- [ ] `useFeatureDataTable` — serializes `Date` fields to ISO strings in response mapping
- [ ] `useFeatureDataTable` — transforms pagination to `{ page, limit, total_pages, total_items }` format
- [ ] `useFeatureOptions` — `staleTime: 300_000`
- [ ] All queries throw `new Error(result.error)` on failure
- [ ] `useCreateFeature` — invalidates `categoryQueryKeys.all` (single call, not multiple)
- [ ] `useUpdateFeature` — invalidates `categoryQueryKeys.all` (single call, not multiple)
- [ ] `useDeleteFeature` — invalidates `categoryQueryKeys.all` (single call, not multiple)
- [ ] All mutations throw full `result` object on failure
- [ ] All mutations have `toast.success` and `handleErrorToast`
- [ ] Barrel exports `useFeatureDataTable` (not `fetchFeatureDataTable`)

---

## Step 9 — Store Layer

Invoke `@nextjs-feature-store`.

Files: `{feature}-dialog.store.ts` + `{feature}-filter.store.ts` + `index.ts`

Verify before moving on:
- [ ] Dialog store: `isCreateOpen`, `isUpdateOpen`, `isDeleteOpen`, `isDetailsOpen`
- [ ] Dialog IDs: `updateId`, `deleteId`, `detailsId` all `number | null`
- [ ] Open actions set boolean AND id atomically in one `set()` call
- [ ] Close actions reset boolean AND id to null atomically
- [ ] Filter store: `search`, `isActive`, `page`, `pageSize`, `sortBy`, `sortOrder`
- [ ] `initialState` as separate const for `resetFilters`
- [ ] All filter setters reset `page: 1` except `setPage`
- [ ] Barrel exports both store hooks only — no interfaces

---

## Step 10 — Components Layer

Invoke `@nextjs-feature-components`. Build in this exact order:

**10a — `types.ts`** `FeatureDialogProps` + `UpdateFeatureDialogProps`

**10b — `forms/create-{feature}-form.tsx`**
- [ ] `zodResolver(createFeatureSchema)`
- [ ] Submit button shows `<Spinner />` when `isPending`
- [ ] `form.reset()` before `onSuccess?.()`

**10c — `forms/update-{feature}-form.tsx`**
- [ ] `isLoading` → centered `<Spinner />` — never text
- [ ] `useEffect` resets form with all fields including `id`
- [ ] Submit button shows `<Spinner />` when `isPending`

**10d — `dialogs/create-{feature}-dialog.tsx`**
- [ ] `onOpenChange={closeCreate}`, `onSuccess={closeCreate}`

**10e — `dialogs/update-{feature}-dialog.tsx`**
- [ ] `if (!updateId) return null` guard

**10f — `dialogs/delete-{feature}-dialog.tsx`**
- [ ] `AlertDialog` not `Dialog`
- [ ] Cancel `disabled` when `isPending`
- [ ] Delete button shows `<Spinner />` when `isPending`
- [ ] Closes only `onSuccess` inside mutate callback

**10g — `dialogs/{feature}-details-dialog.tsx`**
- [ ] `if (!detailsId) return null` guard
- [ ] Three states: `<Spinner />` → data → not found

**10h — `tables/{feature}-columns.tsx`**
- [ ] Column order: select → name → feature-specific → status → createdAt → actions
- [ ] Delete item: `text-destructive focus:text-destructive`

**10i — `tables/{feature}-table.tsx`**
- [ ] `exportConfig` in `useMemo`
- [ ] `fetchDataFn={use{Feature}DataTable}` — the hook from hooks barrel, NOT a plain async function
- [ ] No `useState`, no `useEffect`, no manual refresh logic — hook handles everything

**10j — `pages/{feature}-list-page.tsx`**
- [ ] Only reads `openCreate` from store
- [ ] All four dialogs mounted

**10k — All barrel files**
- [ ] `dialogs/index.ts`, `forms/index.ts`, `tables/index.ts`, `pages/index.ts`
- [ ] Root `components/index.ts` re-exports all with `export *`

---

## Step 11 — Create App Router Page

Create the Next.js page file that renders the feature list page.

File: `app/(protected)/{feature}/page.tsx`

```tsx
import { {Feature}ListPage } from '@/features/{feature}/components'

export default function {Feature}Page() {
  return <{Feature}ListPage />
}
```

Rules:
- No `'use client'` — this is a server component page
- No data fetching here — `{Feature}ListPage` handles everything
- Path is always `app/(protected)/{feature}/page.tsx` — inside the protected route group
- Import through the components barrel — never import directly from component files
- Component name follows: `{Feature}Page` for the default export

Verify:
- [ ] File exists at `app/(protected)/{feature}/page.tsx`
- [ ] Default export is a server component — no `'use client'`
- [ ] Imports `{Feature}ListPage` through components barrel
- [ ] No data fetching, no props, no state

---

## Step 12 — List All Files Created

List every file created including `app/(protected)/{feature}/page.tsx`.

---

## Step 13 — Summary Report

Output:

```
Manual steps required:
1. Add navigation link to sidebar or nav component
2. Verify Drizzle table has all required audit field columns

⚠️ Flag anything that needs attention
```

---

## Step 14 — Final Verification

```bash
npx tsc --noEmit
```

Fix every TypeScript error. Then verify:

**Imports:**
- [ ] Actions imported directly — no barrel
- [ ] Schemas imported directly — no barrel
- [ ] All other layers through `index.ts` barrel

**Audit fields:**
- [ ] No audit fields in any Zod schema
- [ ] `createdBy` injected in create action from `userId`
- [ ] `updatedBy` injected in update action from `userId`
- [ ] `updatedAt: new Date()` in repository update and softDelete

**Spinner:**
- [ ] Zero loading text anywhere
- [ ] Every loading state uses `<Spinner />` from `@/components/ui/spinner`
- [ ] Submit and delete buttons show `<Spinner />` when `isPending`

**Wrappers:**
- [ ] `executeQuery` on every repository method
- [ ] `executeService` on every service method
- [ ] `createAction` on every action

**DataTable hook:**
- [ ] `use{Feature}DataTable` uses `useQuery` with `keepPreviousData` and `staleTime: 30_000`
- [ ] `.isQueryHook = true` set on the hook function after declaration
- [ ] Date fields serialized to ISO strings in response mapping
- [ ] Pagination transformed to snake_case format DataTable expects
- [ ] All mutations invalidate `featureQueryKeys.all` — single call, not multiple

---

## Workflow Rules

- Never skip a step — complete and verify before the next begins
- Never skip a checklist item — fix before marking complete
- If Drizzle table does not exist — stop at Step 1
- If TypeScript errors exist — fix before moving to the next layer
- If unsure about a field or type — re-read the Drizzle table, never guess