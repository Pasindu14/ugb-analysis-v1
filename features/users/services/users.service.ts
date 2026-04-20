import { hash } from '@node-rs/bcrypt'
import { executeService } from '@/lib/services/wrapper'
import { NotFoundError, ConflictError } from '@/lib/errors'
import { UserRepository } from '../repositories/users.repository'
import type { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserFilterDto } from '../schemas/users.schema'
import type { UserSafe, UserUpdate } from '@/db/schema'
import type { OffsetPagination, OffsetPaginatedResult } from '@/lib/queries/pagination'
import { fireAudit } from '@/lib/audit/fire-audit'

export class UserService {
  private static readonly context = 'UserService'

  static async getById(companyId: number, id: number): Promise<UserSafe> {
    return executeService(
      { context: this.context, method: 'getById', logParams: { id, companyId } },
      async () => {
        const user = await UserRepository.findById(companyId, id)
        if (!user) throw new NotFoundError(`User ${id} not found`)
        return user
      }
    )
  }

  static async getAll(
    companyId: number,
    filters?: UserFilterDto,
    pagination?: OffsetPagination
  ): Promise<OffsetPaginatedResult<UserSafe>> {
    return executeService(
      { context: this.context, method: 'getAll', logParams: { companyId } },
      async () => UserRepository.findAllPaginated(companyId, filters, pagination)
    )
  }

  static async create(
    companyId: number,
    actorId: number,
    data: CreateUserDto
  ): Promise<UserSafe> {
    return executeService(
      { context: this.context, method: 'create', logParams: { companyId } },
      async () => {
        const existing = await UserRepository.findByEmail(companyId, data.email)
        if (existing) throw new ConflictError('A user with this email already exists')

        const passwordHash = await hash(data.password, 10)

        const newUser = await UserRepository.create(companyId, {
          email:       data.email,
          passwordHash,
          role:        data.role,
          employeeId:  data.employeeId ?? null,
          isActive:    true,
          lastLoginAt: null,
        })

        fireAudit({ companyId, actorId, entity: 'users', entityId: String(newUser.id), action: 'create', changes: { after: newUser } })

        return newUser
      }
    )
  }

  static async update(
    companyId: number,
    actorId: number,
    id: number,
    data: Omit<UpdateUserDto, 'id'>
  ): Promise<UserSafe> {
    return executeService(
      { context: this.context, method: 'update', logParams: { id, companyId } },
      async () => {
        const oldUser = await UserRepository.findById(companyId, id)
        if (!oldUser) throw new NotFoundError(`User ${id} not found`)

        const updateData: Partial<Pick<UserUpdate, 'email' | 'role' | 'employeeId'>> = {}

        if (data.email      !== undefined) updateData.email      = data.email
        if (data.role       !== undefined) updateData.role       = data.role
        if (data.employeeId !== undefined) updateData.employeeId = data.employeeId ?? null

        const updatedUser = await UserRepository.update(companyId, id, updateData)

        fireAudit({ companyId, actorId, entity: 'users', entityId: String(id), action: 'update', changes: { before: oldUser, after: updatedUser } })

        return updatedUser
      }
    )
  }

  static async changePassword(
    companyId: number,
    actorId: number,
    data: ChangePasswordDto
  ): Promise<UserSafe> {
    return executeService(
      { context: this.context, method: 'changePassword', logParams: { id: data.id, companyId } },
      async () => {
        const existing = await UserRepository.findById(companyId, data.id)
        if (!existing) throw new NotFoundError(`User ${data.id} not found`)

        const passwordHash = await hash(data.password, 10)
        const updatedUser = await UserRepository.update(companyId, data.id, { passwordHash })

        fireAudit({ companyId, actorId, entity: 'users', entityId: String(data.id), action: 'change_password', changes: { before: { id: data.id }, after: { id: data.id } } })

        return updatedUser
      }
    )
  }

  static async toggleStatus(
    companyId: number,
    actorId: number,
    id: number,
    isActive: boolean
  ): Promise<UserSafe> {
    return executeService(
      { context: this.context, method: 'toggleStatus', logParams: { id, companyId, isActive } },
      async () => {
        const oldUser = await UserRepository.findById(companyId, id)
        if (!oldUser) throw new NotFoundError(`User ${id} not found`)

        const updatedUser = await UserRepository.update(companyId, id, { isActive })

        fireAudit({ companyId, actorId, entity: 'users', entityId: String(id), action: 'toggle_status', changes: { before: { isActive: oldUser.isActive }, after: { isActive } } })

        return updatedUser
      }
    )
  }

  static async delete(
    companyId: number,
    actorId: number,
    id: number
  ): Promise<void> {
    return executeService(
      { context: this.context, method: 'delete', logParams: { id, companyId } },
      async () => {
        const oldUser = await UserRepository.findById(companyId, id)
        if (!oldUser) throw new NotFoundError(`User ${id} not found`)

        await UserRepository.softDelete(companyId, id)

        fireAudit({ companyId, actorId, entity: 'users', entityId: String(id), action: 'delete', changes: { before: oldUser } })
      }
    )
  }
}
