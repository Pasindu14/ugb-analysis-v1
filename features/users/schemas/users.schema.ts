import { z } from 'zod'

export const USER_ROLES = ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'] as const
export type UserRole = typeof USER_ROLES[number]

export const createUserSchema = z.object({
  email:      z.string().email('Invalid email address'),
  password:   z.string().min(8, 'Password must be at least 8 characters'),
  role:       z.enum(USER_ROLES),
  employeeId: z.number().int().positive().optional(),
})

export const updateUserSchema = createUserSchema.omit({ password: true }).partial().extend({
  id: z.number().int().positive(),
})

export const changePasswordSchema = z.object({
  id:       z.number().int().positive(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const userFilterSchema = z.object({
  search:   z.string().optional(),
  role:     z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
})

export type CreateUserDto       = z.infer<typeof createUserSchema>
export type UpdateUserDto       = z.infer<typeof updateUserSchema>
export type ChangePasswordDto   = z.infer<typeof changePasswordSchema>
export type UserFilterDto       = z.infer<typeof userFilterSchema>
