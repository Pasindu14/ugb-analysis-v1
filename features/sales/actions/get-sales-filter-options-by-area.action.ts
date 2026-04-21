'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { SalesService } from '@/features/sales/services/sales.service'
import { z } from 'zod'
import type { SalesAreaFilterOptions } from '../schemas/sales.schema'

const schema = z.object({ areaName: z.string().min(1) })

export const getSalesFilterOptionsByAreaAction = createAction(
  { name: 'getSalesFilterOptionsByAreaAction', requireAuth: true },
  async (input: { areaName: string }): Promise<SalesAreaFilterOptions> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    const { areaName } = schema.parse(input)
    return SalesService.getFilterOptionsByArea(companyId, areaName)
  }
)
