import { db, type DbTransaction } from '@/db/drizzle'
import { eq, and, desc, sql, ilike } from 'drizzle-orm'
import { departmentsTable } from '@/db/schema'
import { executeQuery } from '@/lib/queries/wrapper'
import { NotFoundError } from '@/lib/errors'
import {
  getOffset,
  getTotalPages,
  type OffsetPagination,
  type OffsetPaginatedResult,
  DEFAULT_PAGE_SIZE,
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

        if (filters?.search) {
          conditions.push(ilike(departmentsTable.name, `%${filters.search}%`))
        }
        if (filters?.isActive !== undefined) {
          conditions.push(eq(departmentsTable.isActive, filters.isActive))
        }

        const whereClause = and(...conditions)

        const [countResult, items] = await Promise.all([
          tx.select({ count: sql<number>`count(*)::int` }).from(departmentsTable).where(whereClause),
          tx
            .select()
            .from(departmentsTable)
            .where(whereClause)
            .orderBy(desc(departmentsTable.createdAt))
            .limit(pageSize)
            .offset(offset),
        ])

        const total      = countResult[0]?.count ?? 0
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

  static async create(
    companyId: number,
    data: Omit<DepartmentInsert, 'companyId' | 'id' | 'createdAt'>,
    tx: DbTransaction = db
  ): Promise<Department> {
    return executeQuery(
      { context: this.context, method: 'create', logParams: { companyId } },
      async () => {
        const result = await tx
          .insert(departmentsTable)
          .values({ ...data, companyId })
          .returning()
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
          .update(departmentsTable)
          .set(data)
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
          .update(departmentsTable)
          .set({ isActive: false })
          .where(and(eq(departmentsTable.companyId, companyId), eq(departmentsTable.id, id)))
          .returning({ id: departmentsTable.id })
        if (result.length === 0) throw new NotFoundError(`Department ${id} not found`)
      }
    )
  }
}
