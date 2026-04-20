import { db, type DbTransaction } from '@/db/drizzle'
import { eq, and, desc, sql, ilike } from 'drizzle-orm'
import { usersTable } from '@/db/schema'
import { executeQuery } from '@/lib/queries/wrapper'
import { NotFoundError } from '@/lib/errors'
import {
  getOffset,
  getTotalPages,
  type OffsetPagination,
  type OffsetPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/queries/pagination'
import type { User, UserInsert, UserUpdate, UserSafe } from '@/db/schema'
export type UserFilters = {
  search?:   string
  role?:     User['role']
  isActive?: boolean
}

// Explicit column selection — passwordHash is intentionally excluded
const safeColumns = {
  id:          usersTable.id,
  companyId:   usersTable.companyId,
  email:       usersTable.email,
  role:        usersTable.role,
  employeeId:  usersTable.employeeId,
  isActive:    usersTable.isActive,
  lastLoginAt: usersTable.lastLoginAt,
  createdAt:   usersTable.createdAt,
}

export class UserRepository {
  private static readonly context = 'UserRepository'

  static async findById(
    companyId: number,
    id: number,
    tx: DbTransaction = db
  ): Promise<UserSafe | null> {
    return executeQuery(
      { context: this.context, method: 'findById', logParams: { id, companyId } },
      async () => {
        const result = await tx
          .select(safeColumns)
          .from(usersTable)
          .where(and(eq(usersTable.companyId, companyId), eq(usersTable.id, id)))
          .limit(1)
        return (result[0] as UserSafe) ?? null
      }
    )
  }

  static async findByEmail(
    companyId: number,
    email: string,
    tx: DbTransaction = db
  ): Promise<User | null> {
    return executeQuery(
      { context: this.context, method: 'findByEmail', logParams: { companyId } },
      async () => {
        const result = await tx
          .select()
          .from(usersTable)
          .where(and(eq(usersTable.companyId, companyId), eq(usersTable.email, email)))
          .limit(1)
        return result[0] ?? null
      }
    )
  }

  static async findAllPaginated(
    companyId: number,
    filters?: UserFilters,
    pagination: OffsetPagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    tx: DbTransaction = db
  ): Promise<OffsetPaginatedResult<UserSafe>> {
    return executeQuery(
      { context: this.context, method: 'findAllPaginated', logParams: { companyId, filters, ...pagination } },
      async () => {
        const { page, pageSize } = pagination
        const offset = getOffset(page, pageSize)

        const conditions = [eq(usersTable.companyId, companyId)]

        if (filters?.search) {
          conditions.push(ilike(usersTable.email, `%${filters.search}%`))
        }
        if (filters?.role) {
          conditions.push(eq(usersTable.role, filters.role))
        }
        if (filters?.isActive !== undefined) {
          conditions.push(eq(usersTable.isActive, filters.isActive))
        }

        const whereClause = and(...conditions)

        const [countResult, items] = await Promise.all([
          tx.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(whereClause),
          tx
            .select(safeColumns)
            .from(usersTable)
            .where(whereClause)
            .orderBy(desc(usersTable.createdAt))
            .limit(pageSize)
            .offset(offset),
        ])

        const total      = countResult[0]?.count ?? 0
        const totalPages = getTotalPages(total, pageSize)

        return {
          items: items as UserSafe[],
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
    data: Omit<UserInsert, 'companyId' | 'id' | 'createdAt'>,
    tx: DbTransaction = db
  ): Promise<UserSafe> {
    return executeQuery(
      { context: this.context, method: 'create', logParams: { companyId } },
      async () => {
        const result = await tx
          .insert(usersTable)
          .values({ ...data, companyId })
          .returning(safeColumns)
        if (result.length === 0) throw new Error('Create failed')
        return result[0] as UserSafe
      }
    )
  }

  static async update(
    companyId: number,
    id: number,
    data: UserUpdate,
    tx: DbTransaction = db
  ): Promise<UserSafe> {
    return executeQuery(
      { context: this.context, method: 'update', logParams: { id, companyId } },
      async () => {
        const result = await tx
          .update(usersTable)
          .set(data)
          .where(and(eq(usersTable.companyId, companyId), eq(usersTable.id, id)))
          .returning(safeColumns)
        if (result.length === 0) throw new NotFoundError(`User ${id} not found`)
        return result[0] as UserSafe
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
          .update(usersTable)
          .set({ isActive: false })
          .where(and(eq(usersTable.companyId, companyId), eq(usersTable.id, id)))
          .returning({ id: usersTable.id })
        if (result.length === 0) throw new NotFoundError(`User ${id} not found`)
      }
    )
  }
}
