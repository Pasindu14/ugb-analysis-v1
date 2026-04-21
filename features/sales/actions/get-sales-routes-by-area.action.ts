'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { SalesService } from '@/features/sales/services/sales.service'
import { z } from 'zod'

const schema = z.object({ areaName: z.string().min(1) })

export const getSalesRoutesByAreaAction = createAction(
  { name: 'getSalesRoutesByAreaAction', requireAuth: true },
  async (input: { areaName: string }): Promise<string[]> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    const { areaName } = schema.parse(input)
    return SalesService.getRoutesByArea(companyId, areaName)
  }
)
