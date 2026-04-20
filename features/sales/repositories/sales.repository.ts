import { db } from '@/db/drizzle'
import { areaCustomerSalesTable } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { executeQuery } from '@/lib/queries/wrapper'
import {
  getOffset,
  getTotalPages,
  type OffsetPagination,
  type OffsetPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/queries/pagination'
import type { AreaCustomerSale, AreaCustomerSaleInsert } from '@/db/schema'
import type { SalesFilterDto, SalesFilterOptions } from '../schemas/sales.schema'

const BATCH_SIZE = 500

export class SalesRepository {
  private static readonly context = 'SalesRepository'

  static async findAllPaginated(
    companyId: number,
    filters?: SalesFilterDto,
    pagination: OffsetPagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
  ): Promise<OffsetPaginatedResult<AreaCustomerSale>> {
    return executeQuery(
      { context: this.context, method: 'findAllPaginated', logParams: { companyId, filters, ...pagination } },
      async () => {
        const { page, pageSize } = pagination
        const offset = getOffset(page, pageSize)

        const conditions = [eq(areaCustomerSalesTable.companyId, companyId)]

        if (filters?.reportDateFrom) conditions.push(gte(areaCustomerSalesTable.reportDate, filters.reportDateFrom))
        if (filters?.reportDateTo)   conditions.push(lte(areaCustomerSalesTable.reportDate, filters.reportDateTo))
        if (filters?.areaName)        conditions.push(eq(areaCustomerSalesTable.areaName, filters.areaName))
        if (filters?.supervisorName)  conditions.push(eq(areaCustomerSalesTable.supervisorName, filters.supervisorName))
        if (filters?.distributorName) conditions.push(eq(areaCustomerSalesTable.distributorName, filters.distributorName))
        if (filters?.repName)         conditions.push(eq(areaCustomerSalesTable.repName, filters.repName))
        if (filters?.rootName)        conditions.push(eq(areaCustomerSalesTable.rootName, filters.rootName))
        if (filters?.outletType)      conditions.push(eq(areaCustomerSalesTable.outletType, filters.outletType))
        if (filters?.grossMin != null) conditions.push(gte(areaCustomerSalesTable.grossSaleAmount, String(filters.grossMin)))
        if (filters?.grossMax != null) conditions.push(lte(areaCustomerSalesTable.grossSaleAmount, String(filters.grossMax)))
        if (filters?.netMin != null)   conditions.push(gte(areaCustomerSalesTable.netSaleAmount, String(filters.netMin)))
        if (filters?.netMax != null)   conditions.push(lte(areaCustomerSalesTable.netSaleAmount, String(filters.netMax)))

        const whereClause = and(...conditions)

        const [countResult, items] = await Promise.all([
          db.select({ count: sql<number>`count(*)::int` }).from(areaCustomerSalesTable).where(whereClause),
          db.select().from(areaCustomerSalesTable).where(whereClause)
            .orderBy(areaCustomerSalesTable.reportDate, areaCustomerSalesTable.areaName)
            .limit(pageSize)
            .offset(offset),
        ])

        const total      = countResult[0]?.count ?? 0
        const totalPages = getTotalPages(total, pageSize)

        return { items, total, page, pageSize, totalPages, hasMore: page < totalPages }
      }
    )
  }

  static async getFilterOptions(companyId: number): Promise<SalesFilterOptions> {
    return executeQuery(
      { context: this.context, method: 'getFilterOptions', logParams: { companyId } },
      async () => {
        const where = eq(areaCustomerSalesTable.companyId, companyId)

        const [areaNames, supervisorNames, distributorNames, repNames, rootNames, outletTypes, reportDates] =
          await Promise.all([
            db.selectDistinct({ val: areaCustomerSalesTable.areaName })
              .from(areaCustomerSalesTable).where(where)
              .orderBy(areaCustomerSalesTable.areaName),
            db.selectDistinct({ val: areaCustomerSalesTable.supervisorName })
              .from(areaCustomerSalesTable).where(where)
              .orderBy(areaCustomerSalesTable.supervisorName),
            db.selectDistinct({ val: areaCustomerSalesTable.distributorName })
              .from(areaCustomerSalesTable).where(where)
              .orderBy(areaCustomerSalesTable.distributorName),
            db.selectDistinct({ val: areaCustomerSalesTable.repName })
              .from(areaCustomerSalesTable).where(where)
              .orderBy(areaCustomerSalesTable.repName),
            db.selectDistinct({ val: areaCustomerSalesTable.rootName })
              .from(areaCustomerSalesTable).where(where)
              .orderBy(areaCustomerSalesTable.rootName),
            db.selectDistinct({ val: areaCustomerSalesTable.outletType })
              .from(areaCustomerSalesTable).where(where)
              .orderBy(areaCustomerSalesTable.outletType),
            db.selectDistinct({ val: areaCustomerSalesTable.reportDate })
              .from(areaCustomerSalesTable).where(where)
              .orderBy(areaCustomerSalesTable.reportDate),
          ])

        return {
          areaNames:        areaNames.map(r => r.val),
          supervisorNames:  supervisorNames.map(r => r.val),
          distributorNames: distributorNames.map(r => r.val),
          repNames:         repNames.map(r => r.val),
          rootNames:        rootNames.map(r => r.val),
          outletTypes:      outletTypes.map(r => r.val),
          reportDates:      reportDates.map(r => r.val),
        }
      }
    )
  }

  // Deletes existing records for the period then bulk-inserts in batches.
  // This is analytics import data, not a business entity — replace-by-period is intentional.
  static async replaceByPeriod(
    companyId: number,
    reportDate: string,
    rows: AreaCustomerSaleInsert[]
  ): Promise<number> {
    return executeQuery(
      { context: this.context, method: 'replaceByPeriod', logParams: { companyId, reportDate, count: rows.length } },
      async () => {
        await db.delete(areaCustomerSalesTable).where(
          and(
            eq(areaCustomerSalesTable.companyId, companyId),
            eq(areaCustomerSalesTable.reportDate, reportDate),
          )
        )

        if (rows.length === 0) return 0

        let inserted = 0
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          await db.insert(areaCustomerSalesTable).values(rows.slice(i, i + BATCH_SIZE))
          inserted += Math.min(BATCH_SIZE, rows.length - i)
        }
        return inserted
      }
    )
  }
}
