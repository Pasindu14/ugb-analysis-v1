import { executeService } from '@/lib/services/wrapper'
import { SalesRepository } from '../repositories/sales.repository'
import type { SalesFilterDto, SalesFilterOptions } from '../schemas/sales.schema'
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

  static async importPeriod(
    companyId: number,
    reportDate: string,
    rows: AreaCustomerSaleInsert[]
  ): Promise<number> {
    return executeService(
      { context: this.context, method: 'importPeriod', logParams: { companyId, reportDate, count: rows.length } },
      async () => SalesRepository.replaceByPeriod(companyId, reportDate, rows)
    )
  }
}
