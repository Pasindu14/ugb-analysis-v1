'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { SalesService } from '@/features/sales/services/sales.service'
import { z } from 'zod'
import type { RouteConflict } from '../schemas/sales.schema'

const schema = z.object({
  dateFrom: z.string().min(1),
  dateTo:   z.string().min(1),
  areaName: z.string().min(1),
})

export const getRouteConflictsAction = createAction(
  { name: 'getRouteConflictsAction', requireAuth: true },
  async (input: { dateFrom: string; dateTo: string; areaName: string }): Promise<RouteConflict[]> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    const { dateFrom, dateTo, areaName } = schema.parse(input)
    return SalesService.getRouteConflicts(companyId, areaName, dateFrom, dateTo)
  }
)
