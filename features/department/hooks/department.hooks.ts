'use client'

import { useState } from 'react'
import { queryOptions, useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getDepartmentsAction,
  getDepartmentAction,
  createDepartmentAction,
  updateDepartmentAction,
  toggleDepartmentStatusAction,
} from '../actions/department.actions'
import {
  useCreateDialog,
  useEditDialog,
  useActivateDialog,
  useDeactivateDialog,
} from '../store'
import { handleErrorToast } from '@/lib/hooks/use-error-toast'
import type { ActionFailure } from '@/lib/types/actions'
import type { CreateDepartmentDto, UpdateDepartmentDto } from '../schemas/department.schema'

// --- Query key factory ---

export const departmentKeys = {
  all:     ['departments'] as const,
  lists:   ['departments', 'list'] as const,
  list:    (filters: object) => [...departmentKeys.lists, filters] as const,
  details: ['departments', 'detail'] as const,
  detail:  (id: number) => [...departmentKeys.details, id] as const,
}

// --- Query options factory ---

export function departmentQueryOptions(page: number, pageSize: number) {
  return queryOptions({
    queryKey: departmentKeys.list({ page, pageSize }),
    queryFn: async () => {
      const result = await getDepartmentsAction({ page, pageSize })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

// --- Query hooks ---

export function useDepartments(page: number, pageSize: number) {
  return useQuery(departmentQueryOptions(page, pageSize))
}

export function useDepartment(id: number | null) {
  return useQuery({
    queryKey: departmentKeys.detail(id!),
    queryFn: async () => {
      const result = await getDepartmentAction(id!)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: id !== null,
  })
}

// --- DataTable hook ---

export function useDepartmentDataTable(
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
    queryKey: departmentKeys.list({ page, pageSize, search, customFilters }),
    queryFn: async () => {
      const status = customFilters?.status as string | undefined
      const isActive =
        status === 'active'   ? true  :
        status === 'inactive' ? false :
        undefined

      const result = await getDepartmentsAction({
        filters: { search: search || undefined, isActive },
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

;(useDepartmentDataTable as unknown as Record<string, unknown>).isQueryHook = true

// --- Mutation hooks ---

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  const { close } = useCreateDialog()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: CreateDepartmentDto) => {
      const result = await createDepartmentAction(data)
      if (!result.success) throw result
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      setFieldErrors(null)
      close()
      toast.success('Department created successfully')
    },
    onError: (error: ActionFailure) => {
      if (error.fields) setFieldErrors(error.fields)
      handleErrorToast(error, 'department', 'create')
    },
  })

  return { ...mutation, fieldErrors, clearFieldErrors: () => setFieldErrors(null) }
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  const { close } = useEditDialog()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<UpdateDepartmentDto, 'id'> }) => {
      const result = await updateDepartmentAction({ ...data, id })
      if (!result.success) throw result
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      setFieldErrors(null)
      close()
      toast.success('Department updated successfully')
    },
    onError: (error: ActionFailure) => {
      if (error.fields) setFieldErrors(error.fields)
      handleErrorToast(error, 'department', 'update')
    },
  })

  return { ...mutation, fieldErrors, clearFieldErrors: () => setFieldErrors(null) }
}

export function useActivateDepartment() {
  const queryClient = useQueryClient()
  const { close } = useActivateDialog()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await toggleDepartmentStatusAction({ id, isActive: true })
      if (!result.success) throw result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      close()
      toast.success('Department activated successfully')
    },
    onError: (error: ActionFailure) => {
      handleErrorToast(error, 'department', 'activate')
    },
  })
}

export function useDeactivateDepartment() {
  const queryClient = useQueryClient()
  const { close } = useDeactivateDialog()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await toggleDepartmentStatusAction({ id, isActive: false })
      if (!result.success) throw result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      close()
      toast.success('Department deactivated successfully')
    },
    onError: (error: ActionFailure) => {
      handleErrorToast(error, 'department', 'deactivate')
    },
  })
}
