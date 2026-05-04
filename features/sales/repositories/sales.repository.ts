import { db } from '@/db/drizzle'
import { areaCustomerSalesTable } from '@/db/schema'
import { eq, and, gte, lte, sql, isNotNull, inArray } from 'drizzle-orm'

export type ImportHistoryRow = {
  importFileName: string | null
  reportDate: string
  recordCount: number
  importedAt: string
}
import { executeQuery } from '@/lib/queries/wrapper'
import {
  getOffset,
  getTotalPages,
  type OffsetPagination,
  type OffsetPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/queries/pagination'
import type { AreaCustomerSale, AreaCustomerSaleInsert } from '@/db/schema'
import type { SalesFilterDto, SalesFilterOptions, SalesMapPoint, SalesAreaFilterOptions } from '../schemas/sales.schema'

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

  static async findFilterOptionsByArea(
    companyId: number,
    areaName: string
  ): Promise<SalesAreaFilterOptions> {
    return executeQuery(
      { context: this.context, method: 'findFilterOptionsByArea', logParams: { companyId, areaName } },
      async () => {
        const where = and(
          eq(areaCustomerSalesTable.companyId, companyId),
          eq(areaCustomerSalesTable.areaName, areaName),
        )

        const [supervisorNames, distributorNames, repNames, rootNames, outletTypes] = await Promise.all([
          db.selectDistinct({ val: areaCustomerSalesTable.supervisorName })
            .from(areaCustomerSalesTable).where(where).orderBy(areaCustomerSalesTable.supervisorName),
          db.selectDistinct({ val: areaCustomerSalesTable.distributorName })
            .from(areaCustomerSalesTable).where(where).orderBy(areaCustomerSalesTable.distributorName),
          db.selectDistinct({ val: areaCustomerSalesTable.repName })
            .from(areaCustomerSalesTable).where(where).orderBy(areaCustomerSalesTable.repName),
          db.selectDistinct({ val: areaCustomerSalesTable.rootName })
            .from(areaCustomerSalesTable).where(where).orderBy(areaCustomerSalesTable.rootName),
          db.selectDistinct({ val: areaCustomerSalesTable.outletType })
            .from(areaCustomerSalesTable).where(where).orderBy(areaCustomerSalesTable.outletType),
        ])

        return {
          supervisorNames:  supervisorNames.map((r) => r.val),
          distributorNames: distributorNames.map((r) => r.val),
          repNames:         repNames.map((r) => r.val),
          rootNames:        rootNames.map((r) => r.val),
          outletTypes:      outletTypes.map((r) => r.val),
        }
      }
    )
  }

  static async findRoutesByArea(companyId: number, areaName: string): Promise<string[]> {
    return executeQuery(
      { context: this.context, method: 'findRoutesByArea', logParams: { companyId, areaName } },
      async () => {
        const rows = await db
          .selectDistinct({ val: areaCustomerSalesTable.rootName })
          .from(areaCustomerSalesTable)
          .where(and(
            eq(areaCustomerSalesTable.companyId, companyId),
            eq(areaCustomerSalesTable.areaName, areaName),
          ))
          .orderBy(areaCustomerSalesTable.rootName)
        return rows.map((r) => r.val)
      }
    )
  }

  static async findMapPoints(
    companyId: number,
    filters?: SalesFilterDto
  ): Promise<SalesMapPoint[]> {
    return executeQuery(
      { context: this.context, method: 'findMapPoints', logParams: { companyId, filters } },
      async () => {
        const conditions = [
          eq(areaCustomerSalesTable.companyId, companyId),
          isNotNull(areaCustomerSalesTable.latitude),
          isNotNull(areaCustomerSalesTable.longitude),
        ]

        if (filters?.reportDateFrom) conditions.push(gte(areaCustomerSalesTable.reportDate, filters.reportDateFrom))
        if (filters?.reportDateTo)   conditions.push(lte(areaCustomerSalesTable.reportDate, filters.reportDateTo))
        if (filters?.areaName)        conditions.push(eq(areaCustomerSalesTable.areaName, filters.areaName))
        if (filters?.supervisorName)  conditions.push(eq(areaCustomerSalesTable.supervisorName, filters.supervisorName))
        if (filters?.distributorName) conditions.push(eq(areaCustomerSalesTable.distributorName, filters.distributorName))
        if (filters?.repName)         conditions.push(eq(areaCustomerSalesTable.repName, filters.repName))
        if (filters?.rootName)        conditions.push(eq(areaCustomerSalesTable.rootName, filters.rootName))
        if (filters?.outletType)      conditions.push(eq(areaCustomerSalesTable.outletType, filters.outletType))

        const rows = await db
          .select({
            id:              areaCustomerSalesTable.id,
            customerName:    areaCustomerSalesTable.customerName,
            customerCode:    areaCustomerSalesTable.customerCode,
            areaName:        areaCustomerSalesTable.areaName,
            outletType:      areaCustomerSalesTable.outletType,
            latitude:        areaCustomerSalesTable.latitude,
            longitude:       areaCustomerSalesTable.longitude,
            grossSaleAmount: areaCustomerSalesTable.grossSaleAmount,
            netSaleAmount:   areaCustomerSalesTable.netSaleAmount,
            repName:         areaCustomerSalesTable.repName,
            distributorName: areaCustomerSalesTable.distributorName,
            reportDate:      areaCustomerSalesTable.reportDate,
          })
          .from(areaCustomerSalesTable)
          .where(and(...conditions))
          .orderBy(areaCustomerSalesTable.areaName)

        return rows as SalesMapPoint[]
      }
    )
  }

  // Deletes existing records for the period+areas in the file, then bulk-inserts in batches.
  // Scoped to only the area names present in `rows` so uploading one area never wipes another.
  static async replaceByPeriod(
    companyId: number,
    reportDate: string,
    rows: AreaCustomerSaleInsert[],
    importFileName?: string,
  ): Promise<number> {
    return executeQuery(
      { context: this.context, method: 'replaceByPeriod', logParams: { companyId, reportDate, count: rows.length } },
      async () => {
        const areaNames = [...new Set(rows.map((r) => r.areaName).filter(Boolean))]

        if (areaNames.length > 0) {
          await db.delete(areaCustomerSalesTable).where(
            and(
              eq(areaCustomerSalesTable.companyId, companyId),
              eq(areaCustomerSalesTable.reportDate, reportDate),
              inArray(areaCustomerSalesTable.areaName, areaNames),
            )
          )
        }

        if (rows.length === 0) return 0

        const tagged = rows.map((r) => ({ ...r, importFileName: importFileName ?? null }))
        let inserted = 0
        for (let i = 0; i < tagged.length; i += BATCH_SIZE) {
          await db.insert(areaCustomerSalesTable).values(tagged.slice(i, i + BATCH_SIZE))
          inserted += Math.min(BATCH_SIZE, tagged.length - i)
        }
        return inserted
      }
    )
  }

  static async getImportHistory(companyId: number): Promise<ImportHistoryRow[]> {
    return executeQuery(
      { context: this.context, method: 'getImportHistory', logParams: { companyId } },
      async () => {
        const rows = await db
          .select({
            importFileName: areaCustomerSalesTable.importFileName,
            reportDate:     sql<string>`min(${areaCustomerSalesTable.reportDate})`,
            recordCount:    sql<number>`count(*)::int`,
            importedAt:     sql<string>`max(${areaCustomerSalesTable.importedAt})`,
          })
          .from(areaCustomerSalesTable)
          .where(
            and(
              eq(areaCustomerSalesTable.companyId, companyId),
              isNotNull(areaCustomerSalesTable.importFileName),
            )
          )
          .groupBy(areaCustomerSalesTable.importFileName)
          .orderBy(sql`max(${areaCustomerSalesTable.importedAt}) desc`)
        return rows as ImportHistoryRow[]
      }
    )
  }

  static async deleteByImportFileName(companyId: number, importFileName: string): Promise<number> {
    return executeQuery(
      { context: this.context, method: 'deleteByImportFileName', logParams: { companyId, importFileName } },
      async () => {
        const result = await db
          .delete(areaCustomerSalesTable)
          .where(
            and(
              eq(areaCustomerSalesTable.companyId, companyId),
              eq(areaCustomerSalesTable.importFileName, importFileName),
            )
          )
          .returning({ id: areaCustomerSalesTable.id })
        return result.length
      }
    )
  }
}
