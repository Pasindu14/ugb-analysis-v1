'use server'

import { createAction } from '@/lib/actions/wrapper'
import { getAuthUser } from '@/lib/auth/helpers'
import { UnauthorizedError } from '@/lib/errors'
import { UserService } from '@/features/users/services/users.service'
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  userFilterSchema,
  type CreateUserDto,
  type UpdateUserDto,
  type ChangePasswordDto,
  type UserFilterDto,
} from '@/features/users/schemas/users.schema'
import type { OffsetPaginatedResult } from '@/lib/queries/pagination'
import type { UserSafe } from '@/db/schema'

// READ — list

export const getUsersAction = createAction(
  { name: 'getUsersAction', requireAuth: true },
  async (input: { filters?: UserFilterDto; page?: number; pageSize?: number }): Promise<OffsetPaginatedResult<UserSafe>> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validatedFilters = userFilterSchema.safeParse(input.filters ?? {})
    const filters = validatedFilters.success ? validatedFilters.data : undefined

    return UserService.getAll(companyId, filters, {
      page:     input.page     ?? 1,
      pageSize: input.pageSize ?? 20,
    })
  }
)

// READ — single

export const getUserAction = createAction(
  { name: 'getUserAction', requireAuth: true },
  async (id: number): Promise<UserSafe> => {
    const { companyId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')
    return UserService.getById(companyId, id)
  }
)

// CREATE

export const createUserAction = createAction(
  { name: 'createUserAction', requireAuth: true },
  async (input: CreateUserDto): Promise<UserSafe> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validated = createUserSchema.parse(input)
    return UserService.create(companyId, Number(userId), validated)
  }
)

// UPDATE

export const updateUserAction = createAction(
  { name: 'updateUserAction', requireAuth: true },
  async (input: UpdateUserDto): Promise<UserSafe> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validated = updateUserSchema.parse(input)
    const { id, ...rest } = validated

    return UserService.update(companyId, Number(userId), id, rest)
  }
)

// TOGGLE STATUS

export const toggleUserStatusAction = createAction(
  { name: 'toggleUserStatusAction', requireAuth: true },
  async (input: { id: number; isActive: boolean }): Promise<UserSafe> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    return UserService.toggleStatus(companyId, Number(userId), input.id, input.isActive)
  }
)

// CHANGE PASSWORD

export const changePasswordAction = createAction(
  { name: 'changePasswordAction', requireAuth: true },
  async (input: ChangePasswordDto): Promise<UserSafe> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    const validated = changePasswordSchema.parse(input)
    return UserService.changePassword(companyId, Number(userId), validated)
  }
)

// DELETE

export const deleteUserAction = createAction(
  { name: 'deleteUserAction', requireAuth: true },
  async (id: number): Promise<void> => {
    const { companyId, userId } = await getAuthUser()
    if (!companyId) throw new UnauthorizedError('No company associated with this account')

    await UserService.delete(companyId, Number(userId), id)
  }
)
