---
name: playwright-e2e-generator
description: >
  Generate comprehensive Playwright E2E tests for any feature in the HRIS Next.js app.
  Use this skill whenever the user asks to create, generate, write, or add E2E tests,
  Playwright tests, or end-to-end tests for a feature like employees, departments,
  attendance, leave, payroll, shifts, or calendar. Also trigger when the user says things
  like "test the X feature", "add tests for X", "write e2e for X", or "I need E2E
  coverage for X". Playwright is the only E2E framework in this project.
---

# Playwright E2E Test Generator — HRIS

Generate production-ready Playwright E2E tests by analyzing the actual feature implementation — schemas, actions, hooks, components, dialogs, columns — then producing a Page Object Model class and spec files that match the project's conventions.

## Quick Reference

- **Test directory:** `e2e/`
- **Page objects:** `e2e/pages/{feature}.page.ts`
- **Spec files:** `e2e/features/{feature}/`
- **Config:** `playwright.config.ts`
- **Auth setup:** `e2e/auth.setup.ts` (logs in as admin, saves session)
- **Run tests:** `npx playwright test`

For the full conventions and patterns reference, read `references/conventions.md`.

---

## Step 1: Identify and Analyze the Feature

When the user names a feature (e.g., "department", "employee", "leave"):

1. **Locate the feature directory** at `features/{feature}/`
2. **Read these files in parallel:**

| File | What you learn |
|------|----------------|
| `schemas/{feature}.schema.ts` | All form fields, validation rules, types, required vs optional |
| `actions/*.action.ts` | What server actions exist, inputs/outputs |
| `hooks/use-{feature}*.ts` | Query keys, mutations, toast messages |
| `store/{feature}-dialog.store.ts` | Which dialogs exist (create, edit, delete, details) |
| `components/forms/{feature}-form.tsx` | Field labels, conditional fields per mode |
| `components/dialogs/*.tsx` | Dialog headings, button labels, alert dialog patterns |
| `components/tables/{feature}-columns.tsx` | Table column headers, action menu items |
| `components/pages/{feature}-page.tsx` | Page heading, toolbar button text, search placeholder |

3. **Check for existing tests** at `e2e/features/{feature}/` — if tests exist, ask whether to overwrite, extend, or skip.

---

## Step 2: Determine Test Scenarios

Every CRUD feature should get these spec files:

| Spec file | Covers | When to include |
|-----------|--------|-----------------|
| `{feature}-list.spec.ts` | Table renders, column headers, search, empty state | Always |
| `{feature}-create.spec.ts` | Open dialog, validation errors, successful creation, duplicate errors | If createAction exists |
| `{feature}-update.spec.ts` | Edit dialog with pre-filled data, successful update, validation | If updateAction exists |
| `{feature}-delete.spec.ts` | Delete confirmation, cancel, successful deletion | If deleteAction exists |

Additional specs when applicable:
- `{feature}-detail.spec.ts` — if a detail/view page exists
- `{feature}-bulk-upload.spec.ts` — if bulk Excel upload exists
- `{feature}-export.spec.ts` — if Excel export is available

---

## Step 3: Generate the Page Object Model

Create `e2e/pages/{feature}.page.ts`:

```typescript
import { type Page, type Locator, expect } from '@playwright/test'

export interface {Feature}FormData {
  // Mirror the create schema fields; mark optional fields with ?
}

export class {Feature}Page {
  readonly addButton: Locator
  readonly searchInput: Locator
  readonly table: Locator

  constructor(readonly page: Page) {
    this.addButton = page.getByRole('button', { name: 'Add {Feature}' })
    this.searchInput = page.getByPlaceholder('Search...')
    this.table = page.getByRole('table')
  }

  // ─── Navigation ────────────────────────────────────────
  async goto() {
    await this.page.goto('/{feature-route}')
    await this.page.waitForLoadState('networkidle')
  }

  // ─── Table helpers ─────────────────────────────────────
  async getRowByName(name: string) {
    return this.table.getByRole('row').filter({ hasText: name })
  }

  async expectRowExists(name: string) {
    await expect(await this.getRowByName(name)).toBeVisible()
  }

  async expectRowNotExists(name: string) {
    await expect(await this.getRowByName(name)).not.toBeAttached({ timeout: 10_000 })
  }

  // ─── Search ────────────────────────────────────────────
  async search(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500) // debounce
  }

  async clearSearch() {
    await this.searchInput.clear()
    await this.page.waitForTimeout(500)
  }

  // ─── Row actions ───────────────────────────────────────
  async openRowActions(name: string) {
    const row = await this.getRowByName(name)
    await row.getByRole('button', { name: 'Open menu' }).click()
  }

  async clickEdit(name: string) {
    await this.openRowActions(name)
    await this.page.getByRole('menuitem', { name: 'Edit' }).click()
  }

  async clickDelete(name: string) {
    await this.openRowActions(name)
    await this.page.getByRole('menuitem', { name: 'Delete' }).click()
  }

  // ─── Dialog interactions ───────────────────────────────
  async openCreateDialog() {
    await this.addButton.click()
    await expect(this.page.locator('[role="dialog"]')).toBeVisible()
  }

  async fill{Feature}Form(data: Partial<{Feature}FormData>) {
    const dialog = this.page.locator('[role="dialog"]')
    // Use getByLabel with { exact: true } scoped to dialog
    // Handle select fields: click trigger → pick option → wait for popover close
    if (data.name) await dialog.getByLabel('Name', { exact: true }).fill(data.name)
    // ... add more fields from schema
  }

  async submitForm() {
    await this.page.locator('[role="dialog"]').getByRole('button', { name: 'Save' }).click()
  }

  async confirmDeleteAlert() {
    await this.page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  }

  async cancelAlert() {
    await this.page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()
  }

  // ─── Toast assertions ──────────────────────────────────
  async expectSuccessToast(partialText?: string) {
    const toast = this.page.locator('[data-sonner-toast][data-type="success"]').first()
    await expect(toast).toBeVisible({ timeout: 10_000 })
    if (partialText) await expect(toast).toContainText(partialText)
  }

  async expectErrorToast(partialText?: string) {
    const toast = this.page.locator('[data-sonner-toast][data-type="error"]').first()
    await expect(toast).toBeVisible({ timeout: 10_000 })
    if (partialText) await expect(toast).toContainText(partialText)
  }

  async expectFieldError(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible()
  }

  async expectDialogClosed() {
    await expect(this.page.locator('[role="dialog"]')).not.toBeAttached({ timeout: 15_000 })
  }
}
```

### POM Rules

- **Selectors:** Always prefer ARIA-based (`getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`). Only use CSS for Sonner toasts (`[data-sonner-toast]`) and Radix select popovers.
- **Form fields:** Read the actual `<Label>` text from the form component. Use `{ exact: true }`.
- **Select fields:** Click trigger → `getByRole('option', { name })` → wait for `[data-radix-select-content]` to hide.
- **Dialog scoping:** Always scope form interactions to `this.page.locator('[role="dialog"]')`.
- **Timeouts:** `10_000` for assertions, `15_000` for dialog close, `500` for search debounce.

---

## Step 4: Generate Spec Files

```typescript
import { test, expect } from '@playwright/test'
import { {Feature}Page, type {Feature}FormData } from '../../pages/{feature}.page'

const uniqueSuffix = Date.now().toString(36)
const testData: {Feature}FormData = {
  name: `Test {Feature} ${uniqueSuffix}`,
  // ... other required fields
}

test.describe('{Feature} List', () => {
  let page: {Feature}Page

  test.beforeEach(async ({ page: p }) => {
    page = new {Feature}Page(p)
    await page.goto()
  })

  test('should display the {feature} table', async () => {
    await expect(page.table).toBeVisible()
  })

  test('should search {features}', async () => {
    await page.search('nonexistent-xyz-123')
    await expect(page.page.getByText('No results')).toBeVisible()
    await page.clearSearch()
  })
})

test.describe.serial('{Feature} CRUD', () => {
  let featurePage: {Feature}Page

  test.beforeEach(async ({ page }) => {
    featurePage = new {Feature}Page(page)
    await featurePage.goto()
  })

  test('should create a {feature}', async () => {
    await featurePage.openCreateDialog()
    await featurePage.fill{Feature}Form(testData)
    await featurePage.submitForm()
    await featurePage.expectSuccessToast()
    await featurePage.expectDialogClosed()
    await featurePage.expectRowExists(testData.name)
  })

  test('should edit a {feature}', async () => {
    const updated = { ...testData, name: `Updated ${testData.name}` }
    await featurePage.clickEdit(testData.name)
    await featurePage.fill{Feature}Form({ name: updated.name })
    await featurePage.submitForm()
    await featurePage.expectSuccessToast()
    await featurePage.expectRowExists(updated.name)
  })

  test('should delete a {feature}', async () => {
    await featurePage.clickDelete(testData.name)
    await featurePage.confirmDeleteAlert()
    await featurePage.expectSuccessToast()
    await featurePage.expectRowNotExists(testData.name)
  })
})
```

### Key Patterns

- **Independent tests:** `test.describe()` — list, search, filter tests
- **Dependent tests:** `test.describe.serial()` — create → edit → delete flows
- **Unique data:** `Date.now().toString(36)` suffix prevents collisions
- **Validation tests:** Submit empty form → dialog stays open, check field error messages from Zod schema
- **Duplicate tests:** Create entity, try creating same unique field → dialog stays open, error toast

---

## Step 5: Validate and Present

1. List all generated files with paths
2. Summarize test coverage — spec files, test count, flows covered
3. Note any gaps — flows that exist but weren't tested (explain why)
4. Remind to run `npx playwright test`

---

## What NOT to Do

- Never mock server actions or API responses — real E2E against the running app
- Never use `data-testid` unless the component already has one
- Never hardcode IDs or assume database state — always create test data in setup
- Never use `page.waitForTimeout()` except for debounce waits (500ms for search/filter)
- Never import from feature code (schemas, actions) — POM and specs are self-contained
- Never use `test.describe.serial` for independent tests
- Never skip the Page Object Model — spec files always go through POM methods
