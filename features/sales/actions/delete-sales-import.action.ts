'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { SalesService } from '@/features/sales/services/sales.service'
import { z } from 'zod'

const schema = z.object({ importFileName: z.string().min(1) })

export const deleteSalesImportAction = createAction(
  { name: 'deleteSalesImportAction', requireAuth: true },
  async (input: { importFileName: string }): Promise<{ deleted: number }> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    const { importFileName } = schema.parse(input)
    const deleted = await SalesService.deleteImport(companyId, importFileName)
    return { deleted }
  }
)
