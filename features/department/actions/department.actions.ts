'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { DepartmentService } from '@/features/department/services/department.service'
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentFilterSchema,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
  type DepartmentFilterDto,
} from '@/features/department/schemas/department.schema'
import type { OffsetPaginatedResult } from '@/lib/queries/pagination'
import type { Department } from '@/db/schema'

// READ — list

export const getDepartmentsAction = createAction(
  { name: 'getDepartmentsAction', requireAuth: true },
  async (input: { filters?: DepartmentFilterDto; page?: number; pageSize?: number }): Promise<OffsetPaginatedResult<Department>> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validatedFilters = departmentFilterSchema.safeParse(input.filters ?? {})
    const filters = validatedFilters.success ? validatedFilters.data : undefined

    return DepartmentService.getAll(companyId, filters, {
      page:     input.page     ?? 1,
      pageSize: input.pageSize ?? 20,
    })
  }
)

// READ — single

export const getDepartmentAction = createAction(
  { name: 'getDepartmentAction', requireAuth: true },
  async (id: number): Promise<Department> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    return DepartmentService.getById(companyId, id)
  }
)

// CREATE

export const createDepartmentAction = createAction(
  { name: 'createDepartmentAction', requireAuth: true },
  async (input: CreateDepartmentDto): Promise<Department> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validated = createDepartmentSchema.parse(input)
    return DepartmentService.create(companyId, Number(userId), validated)
  }
)

// UPDATE

export const updateDepartmentAction = createAction(
  { name: 'updateDepartmentAction', requireAuth: true },
  async (input: UpdateDepartmentDto): Promise<Department> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validated = updateDepartmentSchema.parse(input)
    const { id, ...rest } = validated

    return DepartmentService.update(companyId, Number(userId), id, rest)
  }
)

// TOGGLE STATUS

export const toggleDepartmentStatusAction = createAction(
  { name: 'toggleDepartmentStatusAction', requireAuth: true },
  async (input: { id: number; isActive: boolean }): Promise<Department> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    return DepartmentService.toggleStatus(companyId, Number(userId), input.id, input.isActive)
  }
)
