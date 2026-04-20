import type { UserRole } from './schemas/users.schema'

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  hr_manager:  'HR Manager',
  manager:     'Manager',
  employee:    'Employee',
}

export const ROLE_VARIANTS: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  super_admin: 'destructive',
  admin:       'default',
  hr_manager:  'default',
  manager:     'secondary',
  employee:    'outline',
}
