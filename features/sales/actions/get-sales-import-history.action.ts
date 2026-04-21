'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { SalesService } from '@/features/sales/services/sales.service'
import type { ImportHistoryRow } from '../repositories/sales.repository'

export const getSalesImportHistoryAction = createAction(
  { name: 'getSalesImportHistoryAction', requireAuth: true },
  async (): Promise<ImportHistoryRow[]> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    return SalesService.getImportHistory(companyId)
  }
)
