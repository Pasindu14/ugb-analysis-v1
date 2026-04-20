import { z } from 'zod'

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
})

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.number().int().positive(),
})

export const departmentFilterSchema = z.object({
  search:   z.string().optional(),
  isActive: z.boolean().optional(),
})

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>
export type DepartmentFilterDto = z.infer<typeof departmentFilterSchema>
