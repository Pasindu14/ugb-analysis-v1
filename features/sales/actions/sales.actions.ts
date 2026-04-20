'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { SalesService } from '@/features/sales/services/sales.service'
import { salesFilterSchema, type SalesFilterDto, type SalesFilterOptions } from '../schemas/sales.schema'
import type { OffsetPaginatedResult } from '@/lib/queries/pagination'
import type { AreaCustomerSale } from '@/db/schema'

export const getSalesAction = createAction(
  { name: 'getSalesAction', requireAuth: true },
  async (input: { filters?: SalesFilterDto; page?: number; pageSize?: number }): Promise<OffsetPaginatedResult<AreaCustomerSale>> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validated = salesFilterSchema.safeParse(input.filters ?? {})
    const filters = validated.success ? validated.data : undefined

    return SalesService.getAll(companyId, filters, {
      page:     input.page     ?? 1,
      pageSize: input.pageSize ?? 20,
    })
  }
)

export const getSalesFilterOptionsAction = createAction(
  { name: 'getSalesFilterOptionsAction', requireAuth: true },
  async (): Promise<SalesFilterOptions> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    return SalesService.getFilterOptions(companyId)
  }
)
