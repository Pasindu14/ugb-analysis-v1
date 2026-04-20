import { executeService } from '@/lib/services/wrapper'
import { NotFoundError, ConflictError } from '@/lib/errors'
import { DepartmentRepository } from '../repositories/department.repository'
import { fireAudit } from '@/lib/audit/fire-audit'
import type { CreateDepartmentDto, UpdateDepartmentDto, DepartmentFilterDto } from '../schemas/department.schema'
import type { Department } from '@/db/schema'
import type { OffsetPagination, OffsetPaginatedResult } from '@/lib/queries/pagination'

export class DepartmentService {
  private static readonly context = 'DepartmentService'

  static async getById(companyId: number, id: number): Promise<Department> {
    return executeService(
      { context: this.context, method: 'getById', logParams: { id, companyId } },
      async () => {
        const item = await DepartmentRepository.findById(companyId, id)
        if (!item) throw new NotFoundError(`Department ${id} not found`)
        return item
      }
    )
  }

  static async getAll(
    companyId: number,
    filters?: DepartmentFilterDto,
    pagination?: OffsetPagination
  ): Promise<OffsetPaginatedResult<Department>> {
    return executeService(
      { context: this.context, method: 'getAll', logParams: { companyId } },
      async () => DepartmentRepository.findAllPaginated(companyId, filters, pagination)
    )
  }

  static async create(
    companyId: number,
    actorId: number,
    data: CreateDepartmentDto
  ): Promise<Department> {
    return executeService(
      { context: this.context, method: 'create', logParams: { companyId } },
      async () => {
        const existing = await DepartmentRepository.findByName(companyId, data.name)
        if (existing) throw new ConflictError('A department with this name already exists')

        const newItem = await DepartmentRepository.create(companyId, {
          name:      data.name,
          isActive:  true,
          createdBy: actorId,
          updatedBy: null,
          updatedAt: null,
        })

        fireAudit({
          companyId,
          actorId,
          entity:   'departments',
          entityId: String(newItem.id),
          action:   'create',
          changes:  { after: newItem },
        })

        return newItem
      }
    )
  }

  static async update(
    companyId: number,
    actorId: number,
    id: number,
    data: Omit<UpdateDepartmentDto, 'id'>
  ): Promise<Department> {
    return executeService(
      { context: this.context, method: 'update', logParams: { id, companyId } },
      async () => {
        const old = await DepartmentRepository.findById(companyId, id)
        if (!old) throw new NotFoundError(`Department ${id} not found`)

        if (data.name && data.name !== old.name) {
          const existing = await DepartmentRepository.findByName(companyId, data.name)
          if (existing) throw new ConflictError('A department with this name already exists')
        }

        const updated = await DepartmentRepository.update(companyId, id, {
          ...data,
          updatedBy: actorId,
          updatedAt: new Date(),
        })

        fireAudit({
          companyId,
          actorId,
          entity:   'departments',
          entityId: String(id),
          action:   'update',
          changes:  { before: old, after: updated },
        })

        return updated
      }
    )
  }

  static async toggleStatus(
    companyId: number,
    actorId: number,
    id: number,
    isActive: boolean
  ): Promise<Department> {
    return executeService(
      { context: this.context, method: 'toggleStatus', logParams: { id, companyId, isActive } },
      async () => {
        const old = await DepartmentRepository.findById(companyId, id)
        if (!old) throw new NotFoundError(`Department ${id} not found`)

        const updated = await DepartmentRepository.update(companyId, id, {
          isActive,
          updatedBy: actorId,
          updatedAt: new Date(),
        })

        fireAudit({
          companyId,
          actorId,
          entity:   'departments',
          entityId: String(id),
          action:   'toggle_status',
          changes:  { before: { isActive: old.isActive }, after: { isActive } },
        })

        return updated
      }
    )
  }
}
