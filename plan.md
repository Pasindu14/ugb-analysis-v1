# MULTI-TENANT HRIS APPLICATION

**System Architecture, Database Schema & Implementation Plan**
Built on SFA Web Starter Kit — Vertical Slice Architecture

> Next.js 16 · Drizzle ORM · PostgreSQL · shadcn/ui · TanStack
> March 2026 — Bio Pack & Technology (Pvt) Ltd

---

## Table of Contents

- [1. Architecture Overview](#1-architecture-overview)
- [2. Database Schema](#2-database-schema)
- [3. Business Rules Engine](#3-business-rules-engine)
- [4. Feature Modules — Vertical Slice Breakdown](#4-feature-modules--vertical-slice-breakdown)
- [5. API & Frontend Patterns](#5-api--frontend-patterns)
- [6. Role-Based Access Control](#6-role-based-access-control)
- [7. Implementation Phases](#7-implementation-phases)
- [8. Open Technical Decisions](#8-open-technical-decisions)

---

## 1. Architecture Overview

### 1.1 Tech Stack

| Layer         | Technology                              | Purpose                                         |
| ------------- | --------------------------------------- | ----------------------------------------------- |
| Framework     | Next.js 16 (App Router) + React 19 + TS | SSR, server actions, middleware                 |
| Database      | PostgreSQL 16+ + Drizzle ORM            | Type-safe SQL, migrations, companyId scoping    |
| Auth          | NextAuth.js v5 (Credentials, JWT)       | Multi-tenant sessions with companyId claim      |
| Server State  | TanStack Query                          | Caching, pagination, optimistic updates         |
| UI State      | Zustand                                 | Dialog state, filter state per feature          |
| Forms         | React Hook Form + Zod resolvers         | Validation shared client/server                 |
| UI            | shadcn/ui + Radix UI + Tailwind CSS 4   | 40+ components pre-configured                   |
| Tables        | TanStack Table + ExcelJS                | Server-side sort/filter/paginate + Excel export |
| URL State     | nuqs                                    | Pagination & filter params in URL               |
| Charts        | Recharts                                | Dashboard analytics                             |
| Dates         | date-fns + date-fns-tz                  | Asia/Colombo timezone handling                  |
| Notifications | sonner                                  | Toast notifications for errors/success          |

### 1.2 Multi-Tenancy Strategy

The starter kit uses companyId-scoped queries on a shared PostgreSQL database. Every business table has a companyId column. Tenant isolation is enforced at the repository layer — every Drizzle query is wrapped with the company scope from the authenticated session.

**Session injection:** NextAuth JWT sessions carry companyId. The createAction wrapper extracts it and passes it down through services → repositories.

**Query scoping:** Every repository function receives companyId as a mandatory parameter. The executeQuery wrapper ensures consistent error handling.

**Audit trail:** createdBy / updatedBy on all entities, auto-injected from session userId.

**Soft deletes:** isActive flag or deletedAt timestamp. No hard deletes.

### 1.3 Vertical Slice Feature Pattern

Each HRIS module lives under `features/{module}/` as a self-contained vertical slice owning its full stack from database to UI. This matches the existing category feature pattern in the starter kit:

| Layer                 | Purpose & File                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `actions/`            | Next.js server actions (CRUD). Uses `createAction` wrapper for auth + error handling.     |
| `repositories/`       | Drizzle DB queries. All scoped by companyId. Uses `executeQuery` wrapper.                 |
| `services/`           | Business logic. Calls repositories. Uses `executeService` wrapper.                        |
| `schemas/`            | Zod validation schemas + TypeScript DTOs. Shared between client forms and server actions. |
| `hooks/`              | TanStack Query hooks. useQuery for reads, useMutation for writes. Uses useErrorToast.     |
| `store/`              | Zustand stores for UI state: dialog open/close, selected row, filter values.              |
| `components/dialogs/` | Create / Update / Delete / Details modals (shadcn Dialog).                                |
| `components/forms/`   | React Hook Form forms with Zod resolvers.                                                 |
| `components/tables/`  | TanStack Table column definitions + table component.                                      |
| `components/pages/`   | Top-level page component composed from table + dialogs + filters.                         |

**Import rule:** Never use barrel exports for actions or schemas to prevent accidental client bundling of server code. Import directly from the specific file.

### 1.4 Wrapper Pattern (Error Handling)

The starter kit centralizes error handling across all layers using three wrapper functions. Every new feature must use these:

**`createAction(schema, handler)`:** Server action wrapper. Validates input with Zod, extracts session (companyId + userId), catches errors, returns `ActionResult<T>` type. All server actions return `{ success, data?, error? }`.

**`executeService(fn)`:** Service layer wrapper. Catches thrown errors, logs them, returns typed result. Business logic validation errors throw typed AppError instances.

**`executeQuery(fn)`:** Repository wrapper. Wraps Drizzle queries with try/catch, handles database constraint errors (unique violations, FK violations), returns typed result.

Client-side: TanStack Query hooks use onError callbacks that trigger sonner toasts via the `useErrorToast` hook. Form-level errors from server actions are mapped back to react-hook-form using `setError`.

### 1.5 Folder Structure (Expanded for HRIS)

| Folder                        | Contents                                                         |
| ----------------------------- | ---------------------------------------------------------------- |
| `app/(auth)/`                 | Login, registration, password reset pages                        |
| `app/(protected)/`            | All authenticated HRIS pages behind middleware                   |
| `app/api/`                    | API routes (biometric webhook, report exports)                   |
| `components/`                 | Shared UI: sidebar, nav, data-table shell, 40+ shadcn components |
| `db/schema/`                  | Drizzle table definitions (all HRIS tables below)                |
| `db/migrations/`              | Drizzle Kit generated SQL migrations                             |
| `db/seed/`                    | Seed data (shifts, leave types, demo company)                    |
| `features/auth/`              | Existing: login form, session management                         |
| `features/company/`           | Company setup, multi-company support                             |
| `features/department/`        | Department CRUD with hierarchy                                   |
| `features/employee/`          | Employee management + bulk import                                |
| `features/shift/`             | Shift definitions + assignments                                  |
| `features/attendance/`        | Biometric ingestion, dashboard, corrections                      |
| `features/calendar/`          | Company calendar + holiday + OT config                           |
| `features/leave/`             | Leave types, requests, approval workflow                         |
| `features/payroll/`           | Pay structure, calculation engine, payslips                      |
| `features/salary-adjustment/` | Monthly additions/deductions + bulk upload                       |
| `features/report/`            | All report types (Excel/PDF export)                              |
| `lib/`                        | auth helpers, error types (AppError), logger, tenant context     |
| `hooks/`                      | useDebounce, useErrorToast, useMobile                            |
| `providers/`                  | QueryProvider, SessionProvider (existing)                        |
| `types/`                      | Global TS types, enums, shared interfaces                        |

---

## 2. Database Schema

All tables include: `id` (UUID PK, default `gen_random_uuid()`), `companyId` (UUID FK → companies, NOT NULL), `createdAt` (timestamptz, default `now()`), `updatedAt` (timestamptz, default `now()`), `createdBy` (UUID FK → users), `updatedBy` (UUID FK → users). Soft deletes via `deletedAt` (timestamptz, nullable) or `isActive` (boolean). These standard columns are omitted from tables below for brevity.

All `audit_logs` entries store old/new value snapshots as JSONB, following the existing starter kit pattern.

### 2.1 Tenant & Auth Tables

#### `companies`

Root tenant entity. Every other table references companyId back to this.

| Column         | Type                | Notes                                             |
| -------------- | ------------------- | ------------------------------------------------- |
| name           | VARCHAR(255)        | Company display name                              |
| slug           | VARCHAR(100) UNIQUE | URL-safe identifier                               |
| registrationNo | VARCHAR(100)        | Business registration                             |
| epfRegNo       | VARCHAR(50)         | EPF registration number                           |
| etfRegNo       | VARCHAR(50)         | ETF registration number                           |
| address        | TEXT                |                                                   |
| country        | VARCHAR(50)         | Default: LK                                       |
| currency       | VARCHAR(10)         | Default: LKR                                      |
| timezone       | VARCHAR(50)         | Default: Asia/Colombo                             |
| logoUrl        | TEXT                | Nullable                                          |
| settings       | JSONB               | Company-level config (OT cap, grace period, etc.) |
| isActive       | BOOLEAN             | Default: true                                     |

#### `users`

Auth users linked to companies. Follows NextAuth adapter pattern.

| Column       | Type                | Notes                                             |
| ------------ | ------------------- | ------------------------------------------------- |
| companyId    | UUID FK             | Tenant scope                                      |
| email        | VARCHAR(255)        | Unique per company                                |
| passwordHash | TEXT                | bcrypt via @node-rs/bcrypt                        |
| role         | ENUM                | super_admin, admin, hr_manager, manager, employee |
| employeeId   | UUID FK → employees | Nullable — links user to employee record          |
| isActive     | BOOLEAN             | Default: true                                     |
| lastLoginAt  | TIMESTAMPTZ         |                                                   |

NextAuth sessions, accounts, and verification_tokens tables follow the standard next-auth Drizzle adapter schema.

### 2.2 Organization Structure Tables

#### `departments`

| Column             | Type                  | Notes                                                                                                                            |
| ------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| companyId          | UUID FK               |                                                                                                                                  |
| name               | VARCHAR(255)          | e.g., General, Packing, Sheet Extruder, Thermo Forming, Paper Cup, Printing, Stores, Vacuum Forming, Lathe & Maintenance, Office |
| parentDepartmentId | UUID FK → departments | Nullable — for hierarchy (leave approval chain)                                                                                  |
| startDate          | DATE                  | Required per client spec                                                                                                         |
| isActive           | BOOLEAN               |                                                                                                                                  |

#### `designations`

| Column    | Type         | Notes                                  |
| --------- | ------------ | -------------------------------------- |
| companyId | UUID FK      |                                        |
| name      | VARCHAR(255) | e.g., QC, Machine Operator, Supervisor |
| isActive  | BOOLEAN      |                                        |

### 2.3 Employee Tables

#### `employees`

Core employee record. Fields derived from Bio Pack Employee Registration Form.

| Column            | Type         | Notes                                                  |
| ----------------- | ------------ | ------------------------------------------------------ |
| companyId         | UUID FK      |                                                        |
| emNumber          | VARCHAR(50)  | Employee number (e.g., 108)                            |
| epfNumber         | VARCHAR(50)  | EPF number                                             |
| fullName          | VARCHAR(255) |                                                        |
| dateOfBirth       | DATE         |                                                        |
| gender            | ENUM         | male, female                                           |
| nicNo             | VARCHAR(20)  | National Identity Card                                 |
| address           | TEXT         |                                                        |
| civilStatus       | ENUM         | married, unmarried                                     |
| telNumber         | VARCHAR(20)  | Landline                                               |
| mobileNumber      | VARCHAR(20)  |                                                        |
| bankAccountNo     | VARCHAR(50)  |                                                        |
| bankName          | VARCHAR(100) |                                                        |
| bankBranch        | VARCHAR(100) |                                                        |
| dateOfJoining     | DATE         | Required                                               |
| dateOfResignation | DATE         | Nullable — setting this changes status to inactive     |
| status            | ENUM         | active, inactive, probation, terminated                |
| isOtEligible      | BOOLEAN      | Default: true. False for non-OT cadre (office 8AM–5PM) |
| profileImageUrl   | TEXT         | Nullable                                               |

Service-layer rule: When `dateOfResignation` is set via the update action, the service auto-sets `status = inactive`.

#### `employeeDepartments`

Department assignment history with validity periods.

| Column        | Type                   | Notes                                 |
| ------------- | ---------------------- | ------------------------------------- |
| companyId     | UUID FK                |                                       |
| employeeId    | UUID FK → employees    |                                       |
| departmentId  | UUID FK → departments  |                                       |
| designationId | UUID FK → designations |                                       |
| validFrom     | DATE                   |                                       |
| validTo       | DATE                   | Nullable (current assignment if null) |

#### `employeeSalaries`

Salary history with effective dates. Each record represents a salary revision.

| Column      | Type                | Notes                             |
| ----------- | ------------------- | --------------------------------- |
| companyId   | UUID FK             |                                   |
| employeeId  | UUID FK → employees |                                   |
| basicSalary | DECIMAL(12,2)       |                                   |
| fromDate    | DATE                | Effective start                   |
| toDate      | DATE                | Nullable (current salary if null) |

### 2.4 Shift Tables

#### `shifts`

Shifts must be assigned to a department per client requirement.

| Column          | Type                  | Notes                                            |
| --------------- | --------------------- | ------------------------------------------------ |
| companyId       | UUID FK               |                                                  |
| departmentId    | UUID FK → departments | Shift assigned to dept                           |
| name            | VARCHAR(100)          | e.g., Morning 6–14, Night 18–06, 24h             |
| startTime       | TIME                  | e.g., 06:00                                      |
| endTime         | TIME                  | e.g., 14:00                                      |
| durationHours   | DECIMAL(4,1)          | e.g., 8.0, 8.5, 12.0, 24.0                       |
| isNightShift    | BOOLEAN               | Triggers Rs.150 night incentive                  |
| crossesMidnight | BOOLEAN               | For night crossover / Saturday → Sunday OT logic |
| isActive        | BOOLEAN               |                                                  |

Seed data shifts: 06:00–14:00, 14:00–22:00, 07:00–15:30, 08:00–16:30, 08:00–17:00, 06:00–18:00, 18:00–06:00, 07:00–07:00 (24h).

#### `employeeShiftAssignments`

| Column        | Type                | Notes                      |
| ------------- | ------------------- | -------------------------- |
| companyId     | UUID FK             |                            |
| employeeId    | UUID FK → employees |                            |
| shiftId       | UUID FK → shifts    |                            |
| effectiveFrom | DATE                |                            |
| effectiveTo   | DATE                | Nullable (current if null) |

### 2.5 Attendance Tables

#### `attendanceRecords`

Raw attendance data from biometric devices or manual entry.

| Column        | Type                | Notes                                           |
| ------------- | ------------------- | ----------------------------------------------- |
| companyId     | UUID FK             |                                                 |
| employeeId    | UUID FK → employees |                                                 |
| date          | DATE                |                                                 |
| punchIn       | TIMESTAMPTZ         |                                                 |
| punchOut      | TIMESTAMPTZ         | Nullable (missing punch)                        |
| shiftId       | UUID FK → shifts    | Auto-aligned from employee assignment           |
| status        | ENUM                | present, absent, late, half_day, leave, holiday |
| lateMinutes   | INTEGER             | Calculated from shift startTime                 |
| otHours       | DECIMAL(4,2)        | Overtime hours worked                           |
| otType        | ENUM                | normal, double, triple                          |
| isManualEntry | BOOLEAN             | Admin added/corrected                           |
| isInvalid     | BOOLEAN             | Flagged for removal                             |
| remarks       | TEXT                |                                                 |
| source        | ENUM                | biometric, manual, bulk_upload                  |

#### `attendanceCorrections`

Audit trail for manual corrections. Follows the audit_logs pattern but attendance-specific.

| Column       | Type                        | Notes               |
| ------------ | --------------------------- | ------------------- |
| companyId    | UUID FK                     |                     |
| attendanceId | UUID FK → attendanceRecords |                     |
| action       | ENUM                        | add, remove, modify |
| reason       | TEXT                        | Required            |
| correctedBy  | UUID FK → users             |                     |

### 2.6 Calendar & Holiday Tables

#### `companyCalendars`

| Column    | Type    | Notes |
| --------- | ------- | ----- |
| companyId | UUID FK |       |
| year      | INTEGER |       |
| isActive  | BOOLEAN |       |

#### `calendarHolidays`

| Column       | Type                       | Notes                                         |
| ------------ | -------------------------- | --------------------------------------------- |
| companyId    | UUID FK                    |                                               |
| calendarId   | UUID FK → companyCalendars |                                               |
| date         | DATE                       |                                               |
| name         | VARCHAR(255)               | e.g., Vesak Poya, Christmas, Independence Day |
| holidayType  | ENUM                       | poya, mercantile, sunday, custom              |
| otMultiplier | ENUM                       | normal_ot, double_ot, triple_ot               |
| isHalfDay    | BOOLEAN                    |                                               |

Rule: Poya days, Sundays, Mercantile holidays = double_ot. Saturday shifts past midnight into Sunday/Poya/Mercantile = double OT from 00:00.

### 2.7 Leave Management Tables

#### `leaveTypes`

| Column              | Type         | Notes                                            |
| ------------------- | ------------ | ------------------------------------------------ |
| companyId           | UUID FK      | Leave structure per company                      |
| name                | VARCHAR(100) | e.g., Annual, Casual, Medical, Maternity, No Pay |
| maxDaysPerYear      | DECIMAL(4,1) |                                                  |
| isCarryForward      | BOOLEAN      |                                                  |
| maxCarryForwardDays | DECIMAL(4,1) |                                                  |
| isPaid              | BOOLEAN      |                                                  |
| isActive            | BOOLEAN      |                                                  |

#### `leaveAssignments`

Per-employee per-year leave entitlement. Assigned when calendar year starts or employee joins.

| Column       | Type                 | Notes                     |
| ------------ | -------------------- | ------------------------- |
| companyId    | UUID FK              |                           |
| employeeId   | UUID FK → employees  |                           |
| leaveTypeId  | UUID FK → leaveTypes |                           |
| year         | INTEGER              |                           |
| entitledDays | DECIMAL(4,1)         |                           |
| usedDays     | DECIMAL(4,1)         | Computed on approval      |
| balanceDays  | DECIMAL(4,1)         | Computed: entitled − used |

#### `leaveRequests`

| Column          | Type                 | Notes                                  |
| --------------- | -------------------- | -------------------------------------- |
| companyId       | UUID FK              |                                        |
| employeeId      | UUID FK → employees  |                                        |
| leaveTypeId     | UUID FK → leaveTypes |                                        |
| startDate       | DATE                 |                                        |
| endDate         | DATE                 |                                        |
| totalDays       | DECIMAL(4,1)         |                                        |
| isHalfDay       | BOOLEAN              |                                        |
| reason          | TEXT                 |                                        |
| status          | ENUM                 | pending, approved, rejected, cancelled |
| approvedBy      | UUID FK → users      | Nullable                               |
| approvedAt      | TIMESTAMPTZ          | Nullable                               |
| rejectionReason | TEXT                 |                                        |

#### `leaveApprovalHierarchy`

Department-based approval chain for leave routing.

| Column         | Type                  | Notes                                         |
| -------------- | --------------------- | --------------------------------------------- |
| companyId      | UUID FK               |                                               |
| departmentId   | UUID FK → departments |                                               |
| approverUserId | UUID FK → users       |                                               |
| level          | INTEGER               | 1 = immediate supervisor, 2 = dept head, etc. |

### 2.8 Payroll Tables

#### `payStructures`

Pay structure template per company and optionally per department.

| Column       | Type                  | Notes                           |
| ------------ | --------------------- | ------------------------------- |
| companyId    | UUID FK               |                                 |
| departmentId | UUID FK → departments | Nullable (company-wide if null) |
| name         | VARCHAR(255)          |                                 |
| isActive     | BOOLEAN               |                                 |

#### `payStructureComponents`

| Column          | Type                    | Notes                                                         |
| --------------- | ----------------------- | ------------------------------------------------------------- |
| companyId       | UUID FK                 |                                                               |
| payStructureId  | UUID FK → payStructures |                                                               |
| name            | VARCHAR(255)            | e.g., Basic Salary, Transport Allowance, Production Incentive |
| type            | ENUM                    | addition, deduction                                           |
| calculationType | ENUM                    | fixed, percentage, formula                                    |
| amount          | DECIMAL(12,2)           | For fixed type                                                |
| percentage      | DECIMAL(5,2)            | For percentage type                                           |
| formulaKey      | VARCHAR(100)            | For computed: epf_employee, etf_employer, etc.                |
| isTaxable       | BOOLEAN                 |                                                               |
| displayOrder    | INTEGER                 | Rendering order on payslip                                    |

#### `salaryAdditionsDeductions`

Per-employee monthly adjustments. Supports manual entry and bulk Excel upload.

| Column           | Type                | Notes                                           |
| ---------------- | ------------------- | ----------------------------------------------- |
| companyId        | UUID FK             |                                                 |
| employeeId       | UUID FK → employees |                                                 |
| month            | INTEGER             | 1–12                                            |
| year             | INTEGER             |                                                 |
| type             | ENUM                | addition, deduction                             |
| name             | VARCHAR(255)        | e.g., Loan Deduction, Salary Advance, Bonus     |
| amount           | DECIMAL(12,2)       |                                                 |
| isRecurring      | BOOLEAN             | For standing orders (scheduled loan deductions) |
| recurringEndDate | DATE                | Nullable                                        |
| source           | ENUM                | manual, bulk_upload                             |

#### `payrollRuns`

Monthly payroll processing record. Status transitions: draft → processing → completed → locked.

| Column          | Type            | Notes                                |
| --------------- | --------------- | ------------------------------------ |
| companyId       | UUID FK         |                                      |
| month           | INTEGER         |                                      |
| year            | INTEGER         |                                      |
| status          | ENUM            | draft, processing, completed, locked |
| processedBy     | UUID FK → users |                                      |
| processedAt     | TIMESTAMPTZ     |                                      |
| lockedAt        | TIMESTAMPTZ     | Prevents further edits               |
| totalGross      | DECIMAL(14,2)   |                                      |
| totalDeductions | DECIMAL(14,2)   |                                      |
| totalNet        | DECIMAL(14,2)   |                                      |

#### `payrollEntries`

Individual employee payroll line item for a given month. Snapshot of all calculated values at processing time.

| Column              | Type                  | Notes                                |
| ------------------- | --------------------- | ------------------------------------ |
| companyId           | UUID FK               |                                      |
| payrollRunId        | UUID FK → payrollRuns |                                      |
| employeeId          | UUID FK → employees   |                                      |
| basicSalary         | DECIMAL(12,2)         | Snapshot                             |
| workingDays         | INTEGER               |                                      |
| presentDays         | INTEGER               |                                      |
| leaveDays           | DECIMAL(4,1)          |                                      |
| absentDays          | DECIMAL(4,1)          |                                      |
| lateDeductionHours  | DECIMAL(4,2)          |                                      |
| otHoursNormal       | DECIMAL(5,2)          |                                      |
| otHoursDouble       | DECIMAL(5,2)          |                                      |
| otHoursTriple       | DECIMAL(5,2)          |                                      |
| otAmount            | DECIMAL(12,2)         |                                      |
| nightIncentive      | DECIMAL(12,2)         | Rs.150 per night-shift day           |
| dailyIncentive      | DECIMAL(12,2)         | Rs.250/day if 4.5h+ completed        |
| productionIncentive | DECIMAL(12,2)         |                                      |
| attendanceIncentive | DECIMAL(12,2)         | Rs.6000 base minus tiered deductions |
| targetIncentive     | DECIMAL(12,2)         | Fixed yearly, adjustable             |
| transportAllowance  | DECIMAL(12,2)         |                                      |
| grossSalary         | DECIMAL(12,2)         |                                      |
| epfEmployee         | DECIMAL(12,2)         | 8% of eligible                       |
| epfEmployer         | DECIMAL(12,2)         | 12% of eligible                      |
| etfEmployer         | DECIMAL(12,2)         | 3% of eligible                       |
| noPayDeduction      | DECIMAL(12,2)         | From basic salary                    |
| lateDeductionAmount | DECIMAL(12,2)         |                                      |
| loanDeduction       | DECIMAL(12,2)         |                                      |
| salaryAdvance       | DECIMAL(12,2)         |                                      |
| otherAdditions      | DECIMAL(12,2)         |                                      |
| otherDeductions     | DECIMAL(12,2)         |                                      |
| totalDeductions     | DECIMAL(12,2)         |                                      |
| netSalary           | DECIMAL(12,2)         |                                      |

### 2.9 Audit & System Tables

#### `auditLogs` (existing in starter kit)

Already built in the starter kit. Tracks all entity changes with old/new JSONB values.

| Column     | Type            | Notes                                      |
| ---------- | --------------- | ------------------------------------------ |
| companyId  | UUID FK         |                                            |
| userId     | UUID FK → users |                                            |
| entityType | VARCHAR(100)    | e.g., employee, payrollEntry, leaveRequest |
| entityId   | UUID            |                                            |
| action     | ENUM            | create, update, delete                     |
| oldValues  | JSONB           | Previous state                             |
| newValues  | JSONB           | New state                                  |
| ipAddress  | VARCHAR(45)     |                                            |

#### `bulkUploadLogs`

| Column      | Type            | Notes                                   |
| ----------- | --------------- | --------------------------------------- |
| companyId   | UUID FK         |                                         |
| uploadedBy  | UUID FK → users |                                         |
| fileName    | VARCHAR(255)    |                                         |
| uploadType  | ENUM            | salary_additions, attendance, employees |
| totalRows   | INTEGER         |                                         |
| successRows | INTEGER         |                                         |
| errorRows   | INTEGER         |                                         |
| errors      | JSONB           | Row-level error details for user review |
| status      | ENUM            | processing, completed, failed           |

---

## 3. Business Rules Engine

All business rules live in the `services/` layer of their respective features. Complex calculations (OT, payroll) get dedicated service files like `features/payroll/services/payroll-calculator.service.ts`.

### 3.1 Overtime Calculation

Hourly rate = Basic Salary ÷ (working days in month × shift hours). Normal OT = 1.5× hourly rate. Double OT = 2× hourly rate. Triple OT = 3× hourly rate.

**Double OT triggers:** Poya days, Sundays, Mercantile holidays. Saturdays that run past midnight into Sunday/Poya/Mercantile get double OT from 00:00 AM.

**Non-OT cadre:** Employees with `isOtEligible = false` (office staff, 8AM–5PM) are excluded from OT calculation entirely.

**OT cap:** Maximum 60 hours OT per month.

**Below 3 months:** Employees under 3 months tenure separated in reporting column, no ETF & EPF deduction.

### 3.2 Incentive Rules

**Night incentive:** Rs.150 per night-shift day. Triggered by `shift.isNightShift = true`.

**Daily incentive:** Rs.250 per day. Requires 4.5 hours minimum worked. Not applicable for 24h duty workers unless they worked at least 8h beyond the 24h.

**Attendance incentive:** Rs.6,000/month base. Deductions: Saturday/half-day leave = Rs.1,000. Weekday leaves: 1st = Rs.1,500, 2nd = Rs.1,500, 3rd = Rs.3,000. Max total deduction = Rs.6,000 (incentive cannot go negative).

**Target incentive:** Fixed yearly per company. Adjustable per year via company settings.

**Production incentive:** Configurable per department/company.

### 3.3 Late Deduction Rules

Grace: 5 minutes late allowed for 2 days per month across all shifts.

**8:01 – 8:15 late:** 0.5 hour deduction.

**8:16 – 9:00 late:** 1.0 hour deduction.

Late deduction amount = (deduction hours ÷ shift hours) × basic daily rate.

### 3.4 EPF / ETF Calculation

**EPF Employee (8%):** Basic Salary − No Pay Deduction.

**EPF Employer (12%):** (Basic Salary + Transport Allowance) − No Pay Deduction.

**ETF Employer (3%):** (Basic Salary + Transport Allowance) − No Pay Deduction.

**Exception:** Employees below 3 months tenure excluded from EPF/ETF. Separated in section column of reports.

### 3.5 New Employee Pro-Rata

For employees under 1 month: salary = (Basic Salary + Production Incentive + Daily Incentive + Night Incentive + OT) × (working days ÷ total working days in month).

### 3.6 No-Pay Deduction

Deducted from Basic Salary. Formula: (Basic Salary ÷ working days in month) × absent days.

---

## 4. Feature Modules — Vertical Slice Breakdown

Each module below follows the exact vertical slice pattern from the starter kit. The `actions/` use `createAction`, `services/` use `executeService`, `repositories/` use `executeQuery`.

### 4.1 `features/company/`

**Schemas:** `createCompanySchema`, `updateCompanySchema` (Zod).

**Actions:** `createCompany`, `updateCompany`, `getCompanies`, `getCompanyById`.

**Pages:** Company settings page. Multi-company switcher if tenant has multiple legal entities.

### 4.2 `features/department/`

**Schemas:** `createDepartmentSchema`, `updateDepartmentSchema`.

**Actions:** Full CRUD. `getDepartmentHierarchy` for tree view.

**Store:** `departmentStore` — dialog state, selected department.

**Components:** `DepartmentTable`, `DepartmentForm`, `DepartmentHierarchyTree`.

### 4.3 `features/employee/`

**Schemas:** `createEmployeeSchema` (all registration form fields), `updateEmployeeSchema`, `bulkImportSchema`.

**Actions:** CRUD + `bulkImportEmployees` (Excel). `resignEmployee` action auto-sets status.

**Store:** `employeeStore` — dialog, filters (department, status, search).

**Components:** `EmployeeTable` (filterable, exportable), `EmployeeForm` (matches Bio Pack form), `EmployeeDetailsPage` (tabs: personal, department history, salary history, attendance, leave).

**Bulk upload:** Excel template download → fill → upload → Zod row validation → preview with errors → confirm.

### 4.4 `features/shift/`

**Schemas:** `createShiftSchema`, `assignShiftSchema`.

**Actions:** CRUD for shifts. `assignShiftToEmployee`, `bulkAssignShift`.

**Components:** `ShiftTable`, `ShiftForm`, `ShiftAssignmentForm`.

### 4.5 `features/attendance/`

**Schemas:** `manualAttendanceSchema`, `correctionSchema`, `bulkAttendanceSchema`.

**Actions:** `getAttendanceDashboard` (with filters), `addManualAttendance`, `removeInvalidAttendance`, `bulkUploadAttendance`.

**Services:** `attendance-processor.service.ts` — aligns punches to shifts, calculates late minutes, determines OT type from calendar.

**Store:** `attendanceStore` — date range, department filter, status filter.

**Components:** `AttendanceDashboard` (date range picker, department/shift/status filters, anomaly indicators), `CorrectionDialog`, `BulkUploadDialog`.

**API route:** `app/api/attendance/biometric/route.ts` — webhook endpoint for biometric device push.

### 4.6 `features/calendar/`

**Schemas:** `createCalendarSchema`, `addHolidaySchema`.

**Actions:** CRUD for calendar, `addHoliday`, `removeHoliday`, `setOtMultiplier`.

**Components:** `CalendarSetupPage` (visual calendar, click to mark holidays, OT multiplier dropdown per date).

### 4.7 `features/leave/`

**Schemas:** `createLeaveTypeSchema`, `leaveRequestSchema`, `leaveApprovalSchema`.

**Actions:** CRUD leave types, `submitLeaveRequest`, `approveLeave`, `rejectLeave`, `getLeaveBalance`.

**Services:** `leave-approval.service.ts` — routes to correct approver based on department hierarchy.

**Components:** `LeaveTypeTable`, `LeaveRequestForm` (employee self-service), `LeaveApprovalQueue` (manager view), `LeaveBalanceCard`.

### 4.8 `features/salary-adjustment/`

**Schemas:** `addAdjustmentSchema`, `bulkAdjustmentSchema`.

**Actions:** `addAdjustment` (select employee, month, year, add/deduct), `bulkUploadAdjustments`.

**Components:** `AdjustmentTable` (filter by employee, month), `AdjustmentForm`, `BulkUploadDialog`.

### 4.9 `features/payroll/`

**Schemas:** `createPayStructureSchema`, `runPayrollSchema`, `payrollFilterSchema`.

**Actions:** `createPayStructure`, `runPayroll`, `lockPayroll`, `getPayrollEntries`, `generatePayslip`, `bulkExportPayslips`.

**Services:** `payroll-calculator.service.ts` — the core engine. Pulls attendance, leave, OT, incentives, salary adjustments, EPF/ETF. Produces payrollEntry per employee.

**Components:** `PayStructureSetup`, `PayrollRunPage` (draft → review → finalize → lock), `PayrollEntryTable` (detailed breakdown per employee), `PayslipPreview`.

### 4.10 `features/report/`

**Actions:** `generateReport` (parameterized by type, date range, filters).

**Report types:** Attendance summary, Payroll register, EPF/ETF contributions, Department salary, Employee salary history, Leave balances, Audit trail.

**Export:** ExcelJS for .xlsx, or PDF via server-side rendering. All reports filterable and exportable.

---

## 5. API & Frontend Patterns

### 5.1 Server Actions (Not REST Routes)

Following the starter kit pattern, all data mutations use Next.js server actions via `createAction` — not REST API routes. Server actions handle auth extraction, Zod validation, and return `ActionResult<T> = { success: true, data: T } | { success: false, error: string }`.

Exception: Biometric device integration uses a traditional API route at `/api/attendance/biometric` because external devices cannot call server actions.

### 5.2 Pagination Pattern

**URL state:** nuqs manages page, pageSize, sortBy, sortOrder, search params in the URL.

**Query:** TanStack Query `useQuery` with `keepPreviousData: true` for smooth transitions.

**Defaults:** page = 1, pageSize = 20 (max 100), search debounced 300ms via `useDebounce` hook.

**Server:** Repository functions accept `PaginationParams { page, pageSize, sortBy, sortOrder, search, filters }` and return `PaginatedResult<T> { data, total, page, pageSize, totalPages }`.

### 5.3 Error Handling (Existing Pattern)

**Server actions:** `createAction` catches all errors. Zod validation → 422-style field errors. AppError subclasses for business logic (e.g., `PayrollAlreadyLocked`, `InsufficientLeaveBalance`). Unknown errors → generic message + logged.

**Client hooks:** `useMutation` onError → `useErrorToast` hook → sonner toast. Form errors mapped via `setError` from ActionResult.

**Global:** React error boundary at app level for unhandled errors.

### 5.4 Bulk Upload Pattern

Consistent across all modules that support Excel upload:

1. Download template (ExcelJS-generated .xlsx with headers and validation notes).
2. User fills data offline.
3. Upload via dialog → ExcelJS parses on client.
4. Row-by-row Zod validation (using the feature's bulk schema).
5. Preview table: green rows = valid, red rows = error with message.
6. Confirm insert → server action processes valid rows.
7. Results logged in `bulkUploadLogs` table.

### 5.5 Data Table Pattern (TanStack Table)

All feature tables extend the starter kit's data-table shell component:

**Server-side:** Sort, filter, paginate via URL params (nuqs).

**Column visibility:** Toggle via dropdown.

**Row selection:** Checkbox column for bulk actions (delete, export).

**Excel export:** ExcelJS export of current filtered view or full dataset.

**Actions column:** Row-level dropdown: Edit, Delete, View Details (opens Zustand-controlled dialog).

---

## 6. Role-Based Access Control

Roles stored in `users.role`. Checked in `createAction` wrapper and via middleware for page access.

| Role        | Scope      | Permissions                                                  |
| ----------- | ---------- | ------------------------------------------------------------ |
| super_admin | Platform   | Manage all tenants/companies, global config                  |
| admin       | Company    | Full access to all HRIS modules within their company         |
| hr_manager  | Company    | Employee CRUD, payroll, attendance, leave, reports, calendar |
| manager     | Department | View team attendance, approve leaves, view team payroll      |
| employee    | Self       | View own payslip, apply leave, view own attendance           |

---

## 7. Implementation Phases

Each phase delivers complete vertical slices. Every feature follows: schema → repository → service → action → hook → store → components.

### Phase 1: Foundation (Weeks 1–3)

Drizzle schema for companies, departments, designations, employees, employeeDepartments, employeeSalaries. Migrations + seed data. `features/company/` (CRUD + settings). `features/department/` (CRUD + hierarchy). `features/employee/` (full CRUD, registration form, department assignment, salary history, bulk import). All using existing auth + audit_logs.

### Phase 2: Shifts & Attendance (Weeks 4–6)

Schema: shifts, employeeShiftAssignments, attendanceRecords, attendanceCorrections. `features/shift/` (CRUD + department assignment). `features/attendance/` (dashboard, biometric API endpoint, manual corrections, anomaly flags, Excel export). Late minutes calculation in service layer.

### Phase 3: Calendar & Leave (Weeks 7–9)

Schema: companyCalendars, calendarHolidays, leaveTypes, leaveAssignments, leaveRequests, leaveApprovalHierarchy. `features/calendar/` (visual setup, holiday marking, OT multiplier). `features/leave/` (types, assignments, request workflow, approval routing, balance tracking). Integration: approved leaves update attendance status.

### Phase 4: Payroll Engine (Weeks 10–14)

Schema: payStructures, payStructureComponents, salaryAdditionsDeductions, payrollRuns, payrollEntries. `features/salary-adjustment/` (manual + bulk Excel). `features/payroll/` (pay structure setup, calculation engine, run workflow, payslip PDF). `payroll-calculator.service.ts`: the core business logic engine pulling all data together.

### Phase 5: Reports & Polish (Weeks 15–17)

`features/report/` (all report types, Excel/PDF export). Bulk payslip export. Audit trail views. Dashboard analytics with Recharts. Employee self-service portal (own payslips, leave requests, attendance view). Performance optimization: database indexes, query optimization.

### Phase 6: Testing & Deploy (Week 18)

End-to-end testing of payroll calculation with real scenarios. Security review (RBAC, tenant isolation). Production deployment. User documentation.

---

## 8. Open Technical Decisions

### 8.1 Decisions Required Before Development

**1. Biometric device:** Which brand/model? Does it push data via HTTP or do we poll? Need vendor API docs.

**2. PDF generation:** `@react-pdf/renderer` (client-side payslips) vs Puppeteer (server-side)? Puppeteer is heavier but produces exact HTML-to-PDF.

**3. Notifications:** Email (Resend / Nodemailer) for leave approvals? In-app notifications table? Both?

**4. File storage:** Local filesystem vs S3-compatible (MinIO / AWS S3) for uploads and generated PDFs?

**5. Background jobs:** Payroll calculation for 500+ employees needs a queue. BullMQ + Redis, or process in server action with streaming status?

**6. Hosting:** Vercel (serverless, 60s function timeout) vs VPS (PM2 + Nginx, no timeout limits)? Payroll runs may exceed serverless limits.

### 8.2 Performance Considerations

Index strategy: composite indexes on `(companyId, employeeId)`, `(companyId, date)`, `(companyId, month, year)`, `(companyId, status)` across all large tables. Payroll batching: process 50 employees per batch, not all at once. Consider PostgreSQL materialized views for attendance summaries and payroll totals. Use cursor-based pagination for employee lists over 1,000.

### 8.3 Drizzle Schema Conventions

Use camelCase column names in Drizzle (maps to snake_case in PostgreSQL via Drizzle config). Every table extends a base columns helper that adds id, companyId, createdAt, updatedAt, createdBy, updatedBy. Enums defined as `pgEnum` and exported from a shared enums file in `db/schema/`. Relation definitions in separate `.relations.ts` files to keep schema files clean.
