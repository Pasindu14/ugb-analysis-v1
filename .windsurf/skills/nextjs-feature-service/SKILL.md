---
name: nextjs-feature-service
description: Creating a service file for a new Next.js feature module in this codebase. Use this when adding a new feature service, writing business logic for a feature like category, product, order, user, or any domain entity. Handles all business rules including conflict checks, slug generation, stock validation, soft delete rules, and any domain logic that sits between actions and raw DB calls. Always class-based with static methods, always uses executeService wrapper, always calls its own feature's repository only. Never contains raw Drizzle calls.
---

# Service Skill

## Location

```
features/{feature}/services/{feature}.service.ts
features/{feature}/services/index.ts
```

Has barrel file. Always import through `index.ts` from outside this folder.

---

## Rules Before Writing Anything

1. Read `AGENTS.md` at the project root first
2. Read the repository skill output — you need to know exactly what repository methods exist and what they accept
3. The service is the business logic layer — ask yourself for every line: "is this a business rule or a DB call?" If it is a DB call, it belongs in the repository. If it is a business rule, it belongs here
4. Never add raw Drizzle calls — if you need a DB operation that does not exist in the repository, go add it to the repository first, then call it here
5. Never add manual try/catch — `executeService` handles logging and re-throws everything as-is up to the action layer

---

## Imports — Always This Exact Set

```ts
import { executeService } from '@/lib/services/wrapper'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import { FeatureRepository } from '@/features/{feature}/repositories'
import type { CreateFeatureDto, UpdateFeatureDto } from '@/features/{feature}/schemas/{feature}.schema'
import type { Feature } from '@/db/schema'
```

Rules:
- Import `executeService` from `@/lib/services/wrapper` always
- Import error classes you actually use — `ConflictError`, `NotFoundError`, `ValidationError`
- Import the repository through its barrel — never import directly from the repository file
- Import DTO types directly from the schema file — no barrel for schemas
- Import entity types from `@/db/schema` — never from the schema file

---

## File Structure — Exact Order

### 1. Class declaration

```ts
export class CategoryService {
  private static readonly context = 'CategoryService'

  // sections follow...
}
```

Always `private static readonly context` — used in every `executeService` call for logging.

---

### 2. Section order inside the class

```
// READ
// CREATE
// UPDATE
// DELETE
// HELPERS (private methods)
```

Use these exact comments as section dividers. Private helper methods always go at the bottom.

---

## READ Methods

Read methods in the service are thin pass-throughs to the repository with one exception — they can add business-level validation before fetching, or combine multiple repository calls when needed.

### `getById`
```ts
static async getById(
  companyId: number,
  id: number
): Promise<Category> {
  return executeService(
    { context: this.context, method: 'getById', companyId, logParams: { id } },
    async () => {
      const category = await CategoryRepository.findById(companyId, id)

      if (!category) {
        throw new NotFoundError(`Category ${id} not found`)
      }

      return category
    }
  )
}
```

Rules:
- Repository `findById` returns `T | null` — service converts null to `NotFoundError`
- Service `getById` always returns `T` — never `T | null`
- This is the key difference between repository and service read methods

---

### `getAll` — Paginated
```ts
static async getAll(
  companyId: number,
  filters?: CategoryFilters,
  pagination?: OffsetPagination
): Promise<OffsetPaginatedResult<Category>> {
  return executeService(
    { context: this.context, method: 'getAll', companyId, logParams: { filters } },
    async () => {
      return CategoryRepository.findAllPaginated(companyId, filters, pagination)
    }
  )
}
```

Rules:
- Import `CategoryFilters` from the repository barrel — it is defined there
- Import pagination types from `@/lib/queries/pagination`
- If no business logic needed beyond the DB call, the service method is a thin pass-through — that is fine and correct

---

### `getOptions` — Dropdown
```ts
static async getOptions(
  companyId: number
): Promise<{ id: number; name: string }[]> {
  return executeService(
    { context: this.context, method: 'getOptions', companyId },
    async () => {
      return CategoryRepository.getOptions(companyId)
    }
  )
}
```

---

## CREATE Methods

This is where the most business logic lives. Always follow this pattern:

```
1. Check for conflicts (slug, SKU, email, name uniqueness)
2. Generate any derived fields (slug from name, etc.)
3. Call repository create
4. Return created entity
```

### `create`
```ts
static async create(
  companyId: number,
  data: CreateCategoryDto & { createdBy: string }
): Promise<Category> {
  return executeService(
    { context: this.context, method: 'create', companyId },
    async () => {
      // 1. Check slug uniqueness if feature has slugs
      const existingSlug = await CategoryRepository.findBySlug(companyId, data.slug)
      if (existingSlug) {
        throw new ConflictError(`A category with slug "${data.slug}" already exists`)
      }

      // 2. Create
      return CategoryRepository.create(companyId, data)
    }
  )
}
```

Rules:
- `data` parameter type is always `CreateFeatureDto & { createdBy: string }` — the DTO from schema plus the audit field injected by the action
- Conflict checks always happen before the insert — never catch DB constraint errors as a substitute for pre-checks
- `ConflictError` for duplicate records — always include the conflicting value in the message
- Slug generation happens here if the feature auto-generates slugs from name:

```ts
// Auto-generate slug from name if not provided
const slug = data.slug ?? this.generateSlug(data.name)

// Check uniqueness of generated slug
const existingSlug = await CategoryRepository.findBySlug(companyId, slug)
if (existingSlug) {
  throw new ConflictError(`A category with this name already exists`)
}

return CategoryRepository.create(companyId, { ...data, slug })
```

---

## UPDATE Methods

```ts
static async update(
  companyId: number,
  id: number,
  data: UpdateCategoryDto & { updatedBy: string }
): Promise<Category> {
  return executeService(
    { context: this.context, method: 'update', companyId, logParams: { id } },
    async () => {
      // 1. Verify record exists and belongs to company
      await this.getById(companyId, id)

      // 2. Check slug uniqueness if slug is being changed
      if (data.slug) {
        const existingSlug = await CategoryRepository.findBySlug(companyId, data.slug)
        if (existingSlug && existingSlug.id !== id) {
          throw new ConflictError(`A category with slug "${data.slug}" already exists`)
        }
      }

      // 3. Update
      return CategoryRepository.update(companyId, id, data)
    }
  )
}
```

Rules:
- `data` parameter type is always `UpdateFeatureDto & { updatedBy: string }`
- Always verify the record exists first by calling `this.getById()` — this gives a clean `NotFoundError` before attempting the update
- Slug uniqueness check on update must exclude the current record: `existingSlug.id !== id`
- Never update `companyId` — it is immutable once set

---

## DELETE Methods

### Soft Delete
```ts
static async delete(
  companyId: number,
  id: number
): Promise<void> {
  return executeService(
    { context: this.context, method: 'delete', companyId, logParams: { id } },
    async () => {
      // 1. Verify record exists
      await this.getById(companyId, id)

      // 2. Business rule checks before deleting
      // Example: prevent deleting a category that has active products
      // const productCount = await ProductRepository.countByCategory(companyId, id)
      // if (productCount > 0) {
      //   throw new ValidationError('Cannot delete a category that has active products')
      // }

      // 3. Soft delete
      await CategoryRepository.softDelete(companyId, id)
    }
  )
}
```

Rules:
- Always verify record exists before deleting
- Business rule checks before deletion live here — e.g. "cannot delete if has children", "cannot delete if referenced by other records"
- These checks are commented as examples — implement only what the feature actually needs
- Return type is always `Promise<void>`

---

## HELPER Methods — Private

Private methods for business logic that is reused across service methods. Always at the bottom of the class.

### Slug generation
```ts
private static generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
```

Rules:
- Always `private static` — never expose slug generation outside the service
- Only add this if the feature uses slugs
- Never put slug generation in the action or repository

---

## Audit Fields in Services

Services receive audit fields from the action as part of the data parameter and pass them through to the repository. Services never call `getAuthUser()` themselves.

```ts
// Action injects audit fields, service receives them in data:
static async create(
  companyId: number,
  data: CreateCategoryDto & { createdBy: string }  // ← action injected this
): Promise<Category> {
  // service passes it through to repository
  return CategoryRepository.create(companyId, data)
}

static async update(
  companyId: number,
  id: number,
  data: UpdateCategoryDto & { updatedBy: string }  // ← action injected this
): Promise<Category> {
  return CategoryRepository.update(companyId, id, data)
}
```

Fields the service never touches:
- `companyId` — received as a parameter, injected by action
- `createdAt` — Drizzle default
- `updatedAt` — repository injects this
- `deletedAt` — repository injects this on softDelete

---

## Cross-Feature Rules in Services

Services call their own feature's repository only. If a service method needs data from another feature, it must receive it as a parameter — injected by the action layer.

```ts
// ❌ Wrong — service calling another feature's repository
static async create(companyId: number, data: CreateProductDto & { createdBy: string }) {
  const category = await CategoryRepository.findById(companyId, data.categoryId) // ← WRONG
  ...
}

// ✅ Correct — action validates cross-feature data, passes result to service
static async create(
  companyId: number,
  data: CreateProductDto & { createdBy: string; categoryExists: boolean }
) {
  if (!data.categoryExists) {
    throw new NotFoundError('Category not found')
  }
  return ProductRepository.create(companyId, data)
}
```

---

## Barrel File

```ts
// features/{feature}/services/index.ts
export { CategoryService } from './{feature}.service'
```

Only export the class. No types exported from the service — types come from schema and repository.

---

## Complete Example — CategoryService

```ts
import { executeService } from '@/lib/services/wrapper'
import { ConflictError, NotFoundError } from '@/lib/errors'
import { CategoryRepository } from '@/features/categories/repositories'
import type { CategoryFilters } from '@/features/categories/repositories'
import type { CreateCategoryDto, UpdateCategoryDto } from '@/features/categories/schemas/category.schema'
import type { Category } from '@/db/schema'
import type { OffsetPagination, OffsetPaginatedResult } from '@/lib/queries/pagination'

export class CategoryService {
  private static readonly context = 'CategoryService'

  // ==========================================================================
  // READ
  // ==========================================================================

  static async getById(companyId: number, id: number): Promise<Category> {
    return executeService(
      { context: this.context, method: 'getById', companyId, logParams: { id } },
      async () => {
        const category = await CategoryRepository.findById(companyId, id)
        if (!category) throw new NotFoundError(`Category ${id} not found`)
        return category
      }
    )
  }

  static async getAll(
    companyId: number,
    filters?: CategoryFilters,
    pagination?: OffsetPagination
  ): Promise<OffsetPaginatedResult<Category>> {
    return executeService(
      { context: this.context, method: 'getAll', companyId },
      async () => CategoryRepository.findAllPaginated(companyId, filters, pagination)
    )
  }

  static async getOptions(companyId: number): Promise<{ id: number; name: string }[]> {
    return executeService(
      { context: this.context, method: 'getOptions', companyId },
      async () => CategoryRepository.getOptions(companyId)
    )
  }

  // ==========================================================================
  // CREATE
  // ==========================================================================

  static async create(
    companyId: number,
    data: CreateCategoryDto & { createdBy: string }
  ): Promise<Category> {
    return executeService(
      { context: this.context, method: 'create', companyId },
      async () => {
        const slug = data.slug ?? this.generateSlug(data.name)

        const existing = await CategoryRepository.findBySlug(companyId, slug)
        if (existing) throw new ConflictError(`Category with slug "${slug}" already exists`)

        return CategoryRepository.create(companyId, { ...data, slug })
      }
    )
  }

  // ==========================================================================
  // UPDATE
  // ==========================================================================

  static async update(
    companyId: number,
    id: number,
    data: UpdateCategoryDto & { updatedBy: string }
  ): Promise<Category> {
    return executeService(
      { context: this.context, method: 'update', companyId, logParams: { id } },
      async () => {
        await this.getById(companyId, id)

        if (data.slug) {
          const existing = await CategoryRepository.findBySlug(companyId, data.slug)
          if (existing && existing.id !== id) {
            throw new ConflictError(`Category with slug "${data.slug}" already exists`)
          }
        }

        return CategoryRepository.update(companyId, id, data)
      }
    )
  }

  // ==========================================================================
  // DELETE
  // ==========================================================================

  static async delete(companyId: number, id: number): Promise<void> {
    return executeService(
      { context: this.context, method: 'delete', companyId, logParams: { id } },
      async () => {
        await this.getById(companyId, id)
        await CategoryRepository.softDelete(companyId, id)
      }
    )
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
}
```

---

## Common Mistakes — Never Do These

- Never write raw Drizzle calls inside a service — if the repository method does not exist, add it to the repository first
- Never call `getAuthUser()` inside a service — auth is handled by actions only
- Never call another feature's repository or service — receive cross-feature data as parameters injected by the action
- Never add manual try/catch — `executeService` re-throws everything as-is
- Never return `T | null` from service read methods — always throw `NotFoundError` instead
- Never put slug generation, SKU generation, or any derived field logic in actions or repositories — always in service private helpers
- Never skip the existence check before update or delete — always call `this.getById()` first
- Never catch DB constraint errors as a substitute for pre-checks — always check for conflicts before insert
- Never expose private helper methods — always `private static`