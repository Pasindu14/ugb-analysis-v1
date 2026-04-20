import { pgTable, serial, bigserial, text, timestamp, boolean, integer, jsonb, index, pgEnum, date, numeric, doublePrecision } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'admin',
  'hr_manager',
  'manager',
  'employee',
])

export const companiesTable = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name"), // nullable
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersTable = pgTable("users", {
  id:           serial("id").primaryKey(),
  companyId:    integer("company_id").notNull().references(() => companiesTable.id),
  email:        text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role:         userRoleEnum("role").notNull().default('employee'),
  employeeId:   integer("employee_id"),
  isActive:     boolean("is_active").notNull().default(true),
  lastLoginAt:  timestamp("last_login_at", { withTimezone: true }),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User       = typeof usersTable.$inferSelect
export type UserInsert = typeof usersTable.$inferInsert
export type UserUpdate = Partial<Omit<UserInsert, 'id' | 'companyId' | 'createdAt'>>
export type UserSafe   = Omit<User, 'passwordHash'>

export const auditLogsTable = pgTable('audit_logs', {
  id:        bigserial('id', { mode: 'number' }).primaryKey(),
  companyId: integer('company_id').notNull().references(() => companiesTable.id),
  actorId:   integer('actor_id').notNull(),   // no FK: log is retained even if the user account is deleted
  entity:    text('entity').notNull(),
  entityId:  text('entity_id'),
  action:    text('action').notNull(),
  changes:   jsonb('changes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type AuditLog       = typeof auditLogsTable.$inferSelect
export type AuditLogInsert = typeof auditLogsTable.$inferInsert

export const departmentsTable = pgTable("departments", {
  id:        serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  name:      text("name").notNull(),
  isActive:  boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  createdBy: integer("created_by").references(() => usersTable.id),
  updatedBy: integer("updated_by").references(() => usersTable.id),
}, (table) => [
  index("departments_company_id_idx")
    .on(table.companyId.asc()),
  index("departments_company_id_is_active_idx")
    .on(table.companyId.asc(), table.isActive.asc())
    .where(sql`${table.isActive} = true`),
  index("departments_company_id_name_idx")
    .on(table.companyId.asc(), table.name.asc()),
  index("departments_company_id_is_active_created_at_idx")
    .on(table.companyId.asc(), table.isActive.asc(), table.createdAt.desc()),
  index("departments_company_id_name_id_idx")
    .on(table.companyId.asc(), table.name.asc(), table.id.asc()),
])

export type Department       = typeof departmentsTable.$inferSelect
export type DepartmentInsert = typeof departmentsTable.$inferInsert
export type DepartmentUpdate = Partial<Omit<DepartmentInsert, 'id' | 'companyId' | 'createdAt'>>

export const areaCustomerSalesTable = pgTable('area_customer_sales', {
  id:              serial('id').primaryKey(),
  companyId:       integer('company_id').notNull().references(() => companiesTable.id),
  reportDate:      date('report_date').notNull(),
  areaName:        text('area_name').notNull(),
  supervisorCode:  integer('supervisor_code').notNull(),
  supervisorName:  text('supervisor_name').notNull(),
  distributorCode: integer('distributor_code').notNull(),
  distributorName: text('distributor_name').notNull(),
  divisionCode:    integer('division_code').notNull(),
  divisionName:    text('division_name').notNull(),
  repCode:         integer('rep_code').notNull(),
  repName:         text('rep_name').notNull(),
  rootCode:        integer('root_code').notNull(),
  rootName:        text('root_name').notNull(),
  outletType:      text('outlet_type').notNull(),
  customerCode:    integer('customer_code').notNull(),
  customerName:    text('customer_name').notNull(),
  grossSaleAmount: numeric('gross_sale_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  netSaleAmount:   numeric('net_sale_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  latitude:        doublePrecision('latitude'),
  longitude:       doublePrecision('longitude'),
  importedAt:      timestamp('imported_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('acs_company_report_date_idx').on(table.companyId, table.reportDate),
  index('acs_company_area_idx').on(table.companyId, table.areaName),
  index('acs_company_outlet_type_idx').on(table.companyId, table.outletType),
  index('acs_company_rep_idx').on(table.companyId, table.repName),
])

export type AreaCustomerSale       = typeof areaCustomerSalesTable.$inferSelect
export type AreaCustomerSaleInsert = typeof areaCustomerSalesTable.$inferInsert
