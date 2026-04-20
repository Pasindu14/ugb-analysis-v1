'use client'

import { useState } from 'react'
import { queryOptions, useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getUsersAction,
  getUserAction,
  createUserAction,
  updateUserAction,
  toggleUserStatusAction,
  changePasswordAction,
  deleteUserAction,
} from '../actions/users.actions'
import {
  useCreateDialog,
  useEditDialog,
  useActivateDialog,
  useDeactivateDialog,
  useChangePasswordDialog,
} from '../store'
import { handleErrorToast } from '@/lib/hooks/use-error-toast'
import type { ActionFailure } from '@/lib/types/actions'
import type { CreateUserDto, UpdateUserDto, ChangePasswordDto } from '../schemas/users.schema'

// --- Query key factory ---

export const userKeys = {
  all:     ['users'] as const,
  lists:   ['users', 'list'] as const,
  list:    (filters: object) => [...userKeys.lists, filters] as const,
  details: ['users', 'detail'] as const,
  detail:  (id: number) => [...userKeys.details, id] as const,
}

// --- Query options factory ---

export function userQueryOptions(page: number, pageSize: number) {
  return queryOptions({
    queryKey: userKeys.list({ page, pageSize }),
    queryFn: async () => {
      const result = await getUsersAction({ page, pageSize })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

// --- Query hooks ---

export function useUsers(page: number, pageSize: number) {
  return useQuery(userQueryOptions(page, pageSize))
}

export function useUser(id: number | null) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: async () => {
      const result = await getUserAction(id!)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: id !== null,
  })
}

// --- DataTable hook ---

export function useUserDataTable(
  page: number,
  pageSize: number,
  search: string,
  _dateRange?: { from_date: string; to_date: string },
  _sortBy?: string,
  _sortOrder?: string,
  _caseConfig?: unknown,
  customFilters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: userKeys.list({ page, pageSize, search, customFilters }),
    queryFn: async () => {
      const status = customFilters?.status as string | undefined
      const isActive =
        status === 'active' ? true :
        status === 'inactive' ? false :
        undefined

      const result = await getUsersAction({
        filters: {
          search:   search || undefined,
          isActive,
        },
        page,
        pageSize,
      })

      if (!result.success) throw new Error(result.error)

      const { items, total, page: p, pageSize: ps, totalPages } = result.data

      return {
        success: true as const,
        data: items,
        pagination: {
          page:        p,
          limit:       ps,
          total_pages: totalPages,
          total_items: total,
        },
      }
    },
    placeholderData: keepPreviousData,
  })
}

;(useUserDataTable as unknown as Record<string, unknown>).isQueryHook = true

// --- Mutation hooks ---

export function useCreateUser() {
  const queryClient = useQueryClient()
  const { close } = useCreateDialog()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: CreateUserDto) => {
      const result = await createUserAction(data)
      if (!result.success) throw result
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      setFieldErrors(null)
      close()
      toast.success('User created successfully')
    },
    onError: (error: ActionFailure) => {
      if (error.fields) setFieldErrors(error.fields)
      handleErrorToast(error, 'user', 'create')
    },
  })

  return { ...mutation, fieldErrors, clearFieldErrors: () => setFieldErrors(null) }
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { close } = useEditDialog()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<UpdateUserDto, 'id'> }) => {
      const result = await updateUserAction({ ...data, id })
      if (!result.success) throw result
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      setFieldErrors(null)
      close()
      toast.success('User updated successfully')
    },
    onError: (error: ActionFailure) => {
      if (error.fields) setFieldErrors(error.fields)
      handleErrorToast(error, 'user', 'update')
    },
  })

  return { ...mutation, fieldErrors, clearFieldErrors: () => setFieldErrors(null) }
}

export function useActivateUser() {
  const queryClient = useQueryClient()
  const { close } = useActivateDialog()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await toggleUserStatusAction({ id, isActive: true })
      if (!result.success) throw result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      close()
      toast.success('User activated successfully')
    },
    onError: (error: ActionFailure) => {
      handleErrorToast(error, 'user', 'activate')
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  const { close } = useDeactivateDialog()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await toggleUserStatusAction({ id, isActive: false })
      if (!result.success) throw result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      close()
      toast.success('User deactivated successfully')
    },
    onError: (error: ActionFailure) => {
      handleErrorToast(error, 'user', 'deactivate')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteUserAction(id)
      if (!result.success) throw result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('User deleted successfully')
    },
    onError: (error: ActionFailure) => {
      handleErrorToast(error, 'user', 'delete')
    },
  })
}

export function useChangePassword() {
  const queryClient = useQueryClient()
  const { close } = useChangePasswordDialog()

  return useMutation({
    mutationFn: async (data: ChangePasswordDto) => {
      const result = await changePasswordAction(data)
      if (!result.success) throw result
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      close()
      toast.success('Password changed successfully')
    },
    onError: (error: ActionFailure) => {
      handleErrorToast(error, 'user', 'change password')
    },
  })
}
