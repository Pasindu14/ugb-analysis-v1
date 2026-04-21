import { executeService } from '@/lib/services/wrapper'
import { SalesRepository, type ImportHistoryRow } from '../repositories/sales.repository'
import type { SalesFilterDto, SalesFilterOptions, SalesMapPoint, SalesAreaFilterOptions } from '../schemas/sales.schema'
import type { AreaCustomerSale, AreaCustomerSaleInsert } from '@/db/schema'
import type { OffsetPagination, OffsetPaginatedResult } from '@/lib/queries/pagination'

export class SalesService {
  private static readonly context = 'SalesService'

  static async getAll(
    companyId: number,
    filters?: SalesFilterDto,
    pagination?: OffsetPagination
  ): Promise<OffsetPaginatedResult<AreaCustomerSale>> {
    return executeService(
      { context: this.context, method: 'getAll', logParams: { companyId } },
      async () => SalesRepository.findAllPaginated(companyId, filters, pagination)
    )
  }

  static async getFilterOptions(companyId: number): Promise<SalesFilterOptions> {
    return executeService(
      { context: this.context, method: 'getFilterOptions', logParams: { companyId } },
      async () => SalesRepository.getFilterOptions(companyId)
    )
  }

  static async getFilterOptionsByArea(
    companyId: number,
    areaName: string
  ): Promise<SalesAreaFilterOptions> {
    return executeService(
      { context: this.context, method: 'getFilterOptionsByArea', logParams: { companyId, areaName } },
      async () => SalesRepository.findFilterOptionsByArea(companyId, areaName)
    )
  }

  static async getRoutesByArea(companyId: number, areaName: string): Promise<string[]> {
    return executeService(
      { context: this.context, method: 'getRoutesByArea', logParams: { companyId, areaName } },
      async () => SalesRepository.findRoutesByArea(companyId, areaName)
    )
  }

  static async getMapPoints(
    companyId: number,
    filters?: SalesFilterDto
  ): Promise<SalesMapPoint[]> {
    return executeService(
      { context: this.context, method: 'getMapPoints', logParams: { companyId } },
      async () => SalesRepository.findMapPoints(companyId, filters)
    )
  }

  static async importPeriod(
    companyId: number,
    reportDate: string,
    rows: AreaCustomerSaleInsert[],
    importFileName?: string,
  ): Promise<number> {
    return executeService(
      { context: this.context, method: 'importPeriod', logParams: { companyId, reportDate, count: rows.length } },
      async () => SalesRepository.replaceByPeriod(companyId, reportDate, rows, importFileName)
    )
  }

  static async getImportHistory(companyId: number): Promise<ImportHistoryRow[]> {
    return executeService(
      { context: this.context, method: 'getImportHistory', logParams: { companyId } },
      async () => SalesRepository.getImportHistory(companyId)
    )
  }

  static async deleteImport(companyId: number, importFileName: string): Promise<number> {
    return executeService(
      { context: this.context, method: 'deleteImport', logParams: { companyId, importFileName } },
      async () => SalesRepository.deleteByImportFileName(companyId, importFileName)
    )
  }
}
