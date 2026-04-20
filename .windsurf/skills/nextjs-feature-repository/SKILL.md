---
name: nextjs-feature-repository
description: Creating a repository file for a new Next.js feature module in this codebase. Use this when adding a new feature repository, creating Drizzle ORM database query methods for a feature like category, product, order, user, or any domain entity. Handles all raw database operations including findById, findAllPaginated, findAllCursor, create, update, softDelete, hardDelete, count, exists using the executeQuery wrapper. Always class-based with static methods, always scoped by companyId, always uses executeQuery wrapper. Never contains business logic.
---

# Repository Skill

## Location

```
features/{feature}/repositories/{feature}.repository.ts
features/{feature}/repositories/index.ts
```

Has barrel file. Always import through `index.ts` from outside this folder.

---

## Rules Before Writing Anything

1. Read `AGENTS.md` at the project root first
2. Read the schema skill output — you need the filter type (`FeatureFilters`) from the repository file itself and the entity types from `@/db/schema`
3. Check `@/db/schema` for the exact table definition — column names, types, which soft delete pattern (`deletedAt` timestamp vs `isActive` boolean)
4. Check `@/lib/queries/wrapper.ts` for `executeQuery` signature
5. Check `@/lib/queries/pagination.ts` for pagination types
6. Never add business logic — if you find yourself writing an if/else about business rules, stop — that belongs in the service

---

## Imports — Always This Exact Set

```ts
import { db, type DbTransaction } from '@/db/drizzle'
import { eq, and, desc, sql, like, isNull, inArray, lt } from 'drizzle-orm'
import { featureTable } from '@/db/schema'
import { executeQuery } from '@/lib/queries/wrapper'
import { NotFoundError } from '@/lib/errors'
import {
  getOffset,
  getTotalPages,
  type OffsetPagination,
  type OffsetPaginatedResult,
  type CursorPagination,
  type CursorPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/queries/pagination'
import type { Feature, FeatureInsert, FeatureUpdate } from '@/db/schema'
```

Only import Drizzle operators you actually use. Never import unused operators.

---

## File Structure — Exact Order

Follow this exact section order. Use the section comments exactly as shown.

### 1. Filters type
Define the filter type at the top of the file — not in the schema file. This is repository-level input.

```ts
export type CategoryFilters = {
  search?: string
  isActive?: boolean
}
```

Add only filters that map directly to DB columns. No computed or derived filters.

---

### 2. Class declaration

```ts
export class CategoryRepository {
  private static readonly context = 'CategoryRepository'
  
  // sections follow...
}
```

Always `private static readonly context` — used in every `executeQuery` call for logging.

---

### 3. Section order inside the class

```
// READ - Single Record
// READ - Multiple Records (Offset Pagination)
// READ - Multiple Records (Cursor Pagination)
// READ - Batch
// WRITE - Create
// WRITE - Update
// WRITE - Delete
// AGGREGATES
```

Use these exact comments as section dividers. Never reorder sections.

---

## READ Methods

### `findById`
```ts
static async findById(
  companyId: number,
  id: number,
  tx: DbTransaction = db
): Promise<Category | null> {
  return executeQuery(
    { context: this.context, method: 'findById', companyId, logParams: { id } },
    async () => {
      const result = await tx
        .select()
        .from(categoriesTable)
        .where(and(
          eq(categoriesTable.companyId, companyId),
          eq(categoriesTable.id, id),
          isNull(categoriesTable.deletedAt)  // only if table uses deletedAt
        ))
        .limit(1)

      return result[0] ?? null
    }
  )
}
```

Rules:
- Always returns `T | null` — never throws on not found at repository level
- Always scoped by `companyId` first in the `and()` clause
- Always filter soft-deleted records — check which pattern the table uses:
  - `deletedAt` timestamp → `isNull(table.deletedAt)`
  - `isActive` boolean → `eq(table.isActive, true)` only when reading active records
- Always `.limit(1)` on single record queries
- Always `tx: DbTransaction = db` as the last parameter for transaction support

---

### `findAllPaginated` — Offset Pagination
Use for admin tables, reports, anything needing total count.

```ts
static async findAllPaginated(
  companyId: number,
  filters?: CategoryFilters,
  pagination: OffsetPagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  tx: DbTransaction = db
): Promise<OffsetPaginatedResult<Category>> {
  return executeQuery(
    { context: this.context, method: 'findAllPaginated', companyId, logParams: { filters, ...pagination } },
    async () => {
      const { page, pageSize } = pagination
      const offset = getOffset(page, pageSize)

      const conditions = [
        eq(categoriesTable.companyId, companyId),
        isNull(categoriesTable.deletedAt),
      ]

      if (filters?.search) {
        conditions.push(like(categoriesTable.name, `%${filters.search}%`))
      }
      if (filters?.isActive !== undefined) {
        conditions.push(eq(categoriesTable.isActive, filters.isActive))
      }

      const whereClause = and(...conditions)

      const [countResult, items] = await Promise.all([
        tx
          .select({ count: sql<number>`count(*)::int` })
          .from(categoriesTable)
          .where(whereClause),
        tx
          .select()
          .from(categoriesTable)
          .where(whereClause)
          .orderBy(desc(categoriesTable.createdAt))
          .limit(pageSize)
          .offset(offset),
      ])

      const total = countResult[0]?.count ?? 0
      const totalPages = getTotalPages(total, pageSize)

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      }
    }
  )
}
```

Rules:
- Count and items queries always run in `Promise.all` — never sequential
- Build conditions array first, then spread into `and(...conditions)`
- Always `orderBy(desc(table.createdAt))` as default sort
- `getOffset` and `getTotalPages` always from `@/lib/queries/pagination`

---

### `findAllCursor` — Cursor Pagination
Use for large datasets, infinite scroll, performance-critical lists.

```ts
static async findAllCursor(
  companyId: number,
  filters?: CategoryFilters,
  pagination: CursorPagination = { limit: DEFAULT_PAGE_SIZE },
  tx: DbTransaction = db
): Promise<CursorPaginatedResult<Category>> {
  return executeQuery(
    { context: this.context, method: 'findAllCursor', companyId, logParams: { filters, ...pagination } },
    async () => {
      const { cursor, limit } = pagination

      const conditions = [
        eq(categoriesTable.companyId, companyId),
        isNull(categoriesTable.deletedAt),
      ]

      if (filters?.search) {
        conditions.push(like(categoriesTable.name, `%${filters.search}%`))
      }
      if (filters?.isActive !== undefined) {
        conditions.push(eq(categoriesTable.isActive, filters.isActive))
      }
      if (cursor) {
        conditions.push(lt(categoriesTable.createdAt, new Date(cursor)))
      }

      const items = await tx
        .select()
        .from(categoriesTable)
        .where(and(...conditions))
        .orderBy(desc(categoriesTable.createdAt))
        .limit(limit + 1)

      const hasMore = items.length > limit
      if (hasMore) items.pop()

      const nextCursor = hasMore && items.length > 0
        ? items[items.length - 1].createdAt.toISOString()
        : null

      return { items, nextCursor, hasMore }
    }
  )
}
```

Rules:
- Always fetch `limit + 1` to determine `hasMore` — never run a separate count query
- Always `items.pop()` when `hasMore` is true before returning
- Cursor is always `createdAt.toISOString()` — consistent across all features
- `lt(table.createdAt, new Date(cursor))` for the cursor condition

---

### `findByIds` — Batch Read
```ts
static async findByIds(
  companyId: number,
  ids: number[],
  tx: DbTransaction = db
): Promise<Category[]> {
  return executeQuery(
    { context: this.context, method: 'findByIds', companyId, logParams: { count: ids.length } },
    async () => {
      if (ids.length === 0) return []

      return await tx
        .select()
        .from(categoriesTable)
        .where(and(
          eq(categoriesTable.companyId, companyId),
          inArray(categoriesTable.id, ids),
          isNull(categoriesTable.deletedAt)
        ))
    }
  )
}
```

Rules:
- Always guard `if (ids.length === 0) return []` before the query
- Use `inArray` from drizzle-orm — never loop with individual queries

---

### `getOptions` — Dropdown Select
Lightweight query for foreign key selects. Always present if the feature is referenced by other features.

```ts
static async getOptions(
  companyId: number,
  tx: DbTransaction = db
): Promise<{ id: number; name: string }[]> {
  return executeQuery(
    { context: this.context, method: 'getOptions', companyId },
    async () => {
      return await tx
        .select({ id: categoriesTable.id, name: categoriesTable.name })
        .from(categoriesTable)
        .where(and(
          eq(categoriesTable.companyId, companyId),
          eq(categoriesTable.isActive, true)
        ))
        .orderBy(categoriesTable.name)
    }
  )
}
```

Rules:
- Select only `id` and `name` — never select full record for options
- Always filter `isActive: true` for options — never show inactive items in dropdowns
- Always `orderBy(table.name)` for consistent dropdown order

---

## WRITE Methods

### `create`
```ts
static async create(
  companyId: number,
  data: Omit<CategoryInsert, 'companyId' | 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  tx: DbTransaction = db
): Promise<Category> {
  return executeQuery(
    { context: this.context, method: 'create', companyId },
    async () => {
      const result = await tx
        .insert(categoriesTable)
        .values({ ...data, companyId })
        .returning()

      if (result.length === 0) throw new Error('Create failed')
      return result[0]
    }
  )
}
```

Rules:
- `Omit` always removes: `'companyId' | 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'`
- `companyId` always injected from the parameter — never from `data`
- Always `.returning()` to get the created record back
- Always check `result.length === 0` and throw

---

### `update`
```ts
static async update(
  companyId: number,
  id: number,
  data: CategoryUpdate,
  tx: DbTransaction = db
): Promise<Category> {
  return executeQuery(
    { context: this.context, method: 'update', companyId, logParams: { id } },
    async () => {
      const result = await tx
        .update(categoriesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(categoriesTable.companyId, companyId),
          eq(categoriesTable.id, id),
          isNull(categoriesTable.deletedAt)
        ))
        .returning()

      if (result.length === 0) throw new NotFoundError(`Category ${id} not found`)
      return result[0]
    }
  )
}
```

Rules:
- Always inject `updatedAt: new Date()` in `.set()` — never rely on caller to set it
- Always scope WHERE by `companyId` AND `id` — never update without both
- Always `.returning()` to get the updated record back
- Throw `NotFoundError` when `result.length === 0`

---

## DELETE Methods

### `softDelete`
Use when table has `deletedAt` timestamp column:

```ts
static async softDelete(
  companyId: number,
  id: number,
  tx: DbTransaction = db
): Promise<void> {
  return executeQuery(
    { context: this.context, method: 'softDelete', companyId, logParams: { id } },
    async () => {
      const result = await tx
        .update(categoriesTable)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(
          eq(categoriesTable.companyId, companyId),
          eq(categoriesTable.id, id),
          isNull(categoriesTable.deletedAt)
        ))
        .returning({ id: categoriesTable.id })

      if (result.length === 0) throw new NotFoundError(`Category ${id} not found`)
    }
  )
}
```

Use when table has `isActive` boolean column:

```ts
static async softDelete(
  companyId: number,
  id: number,
  tx: DbTransaction = db
): Promise<void> {
  return executeQuery(
    { context: this.context, method: 'softDelete', companyId, logParams: { id } },
    async () => {
      const result = await tx
        .update(categoriesTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(categoriesTable.companyId, companyId),
          eq(categoriesTable.id, id)
        ))
        .returning({ id: categoriesTable.id })

      if (result.length === 0) throw new NotFoundError(`Category ${id} not found`)
    }
  )
}
```

Rules:
- Always check the Drizzle table definition to know which soft delete pattern applies
- Always inject `updatedAt: new Date()` alongside the soft delete field
- Only `.returning({ id: table.id })` — no need to return full record on delete
- Return type is always `Promise<void>`

### `hardDelete`
Only add this method if the feature explicitly requires permanent deletion. Most features do not need this.

```ts
static async hardDelete(
  companyId: number,
  id: number,
  tx: DbTransaction = db
): Promise<void> {
  return executeQuery(
    { context: this.context, method: 'hardDelete', companyId, logParams: { id } },
    async () => {
      const result = await tx
        .delete(categoriesTable)
        .where(and(
          eq(categoriesTable.companyId, companyId),
          eq(categoriesTable.id, id)
        ))
        .returning({ id: categoriesTable.id })

      if (result.length === 0) throw new NotFoundError(`Category ${id} not found`)
    }
  )
}
```

---

## AGGREGATE Methods

### `count`
```ts
static async count(
  companyId: number,
  filters?: CategoryFilters,
  tx: DbTransaction = db
): Promise<number> {
  return executeQuery(
    { context: this.context, method: 'count', companyId, logParams: { filters } },
    async () => {
      const conditions = [
        eq(categoriesTable.companyId, companyId),
        isNull(categoriesTable.deletedAt),
      ]

      if (filters?.search) {
        conditions.push(like(categoriesTable.name, `%${filters.search}%`))
      }
      if (filters?.isActive !== undefined) {
        conditions.push(eq(categoriesTable.isActive, filters.isActive))
      }

      const result = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(categoriesTable)
        .where(and(...conditions))

      return result[0]?.count ?? 0
    }
  )
}
```

### `exists`
```ts
static async exists(
  companyId: number,
  id: number,
  tx: DbTransaction = db
): Promise<boolean> {
  return executeQuery(
    { context: this.context, method: 'exists', companyId, logParams: { id } },
    async () => {
      const result = await tx
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(and(
          eq(categoriesTable.companyId, companyId),
          eq(categoriesTable.id, id),
          isNull(categoriesTable.deletedAt)
        ))
        .limit(1)

      return result.length > 0
    }
  )
}
```

---

## Audit Fields in Repositories

Repositories inject these fields directly — never receive them from the caller:

```
updatedAt   →  always set to new Date() in every .set() call
deletedAt   →  set to new Date() only on softDelete
```

These are never injected by repositories — they come from the action layer:
```
createdBy   →  comes in via data parameter, set by action
updatedBy   →  comes in via data parameter, set by action
companyId   →  comes in via companyId parameter, set by action
createdAt   →  Drizzle default, never set manually
```

---

## Barrel File

```ts
// features/{feature}/repositories/index.ts
export { CategoryRepository } from './{feature}.repository'
export type { CategoryFilters } from './{feature}.repository'
```

Always export the class and the filters type from the barrel.

---

## Common Mistakes — Never Do These

- Never call `executeQuery` without the `context` and `method` fields — logging depends on them
- Never write business logic — no slug generation, no conflict checks, no price rules
- Never throw errors other than `NotFoundError` and `new Error('Create failed')` — all other errors are mapped by `executeQuery` wrapper automatically
- Never forget `companyId` scope on every single query — every WHERE clause starts with `eq(table.companyId, companyId)`
- Never forget soft delete filter on READ queries — always `isNull(table.deletedAt)` or `eq(table.isActive, true)`
- Never run count and items queries sequentially — always `Promise.all`
- Never fetch full records for dropdown options — always select only `id` and `name`
- Never set `createdAt` manually — Drizzle default handles it
- Never forget `tx: DbTransaction = db` as the last param — every method must support transactions
- Never add manual try/catch — `executeQuery` handles all error mapping