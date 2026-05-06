'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { SalesService } from '@/features/sales/services/sales.service'
import { salesFilterSchema, type SalesFilterDto, type MissingLocationSummary } from '../schemas/sales.schema'

export const getSalesMissingLocationSummaryAction = createAction(
  { name: 'getSalesMissingLocationSummaryAction', requireAuth: true },
  async (input: { filters?: SalesFilterDto }): Promise<MissingLocationSummary> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validated = salesFilterSchema.safeParse(input.filters ?? {})
    const filters = validated.success ? validated.data : undefined

    return SalesService.getMissingLocationSummary(companyId, filters)
  }
)
