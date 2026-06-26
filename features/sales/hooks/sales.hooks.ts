'use client'

import { useQuery, useQueries, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSalesAction, getSalesFilterOptionsAction } from '../actions/sales.actions'
import { getSalesMapPointsAction } from '../actions/get-sales-map-points.action'
import { getSalesMissingLocationSummaryAction } from '../actions/get-sales-missing-location-summary.action'
import { getSalesRoutesByAreaAction } from '../actions/get-sales-routes-by-area.action'
import { getSalesFilterOptionsByAreaAction } from '../actions/get-sales-filter-options-by-area.action'
import { getSalesImportHistoryAction } from '../actions/get-sales-import-history.action'
import { deleteSalesImportAction } from '../actions/delete-sales-import.action'
import { getRouteConflictsAction } from '../actions/get-route-conflicts.action'
import { useImportDialog, useManageImportsDialog } from '../store'
import type { SalesFilterDto, SalesMapPoint, SalesAreaFilterOptions, MissingLocationSummary, RouteConflict, ConflictFilterDto } from '../schemas/sales.schema'
import type { ImportHistoryRow } from '../repositories/sales.repository'

export const salesKeys = {
  all:     ['sales'] as const,
  lists:   ['sales', 'list'] as const,
  list:    (filters: object) => [...salesKeys.lists, filters] as const,
  options: ['sales', 'filter-options'] as const,
}

export function useSalesFilterOptions() {
  return useQuery({
    queryKey: salesKeys.options,
    queryFn: async () => {
      const result = await getSalesFilterOptionsAction()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 min — distinct values don't change during a session
  })
}

export function useSalesDataTable(
  page: number,
  pageSize: number,
  search: string,
  _dateRange?: { from_date: string; to_date: string },
  _sortBy?: string,
  _sortOrder?: string,
  _caseConfig?: unknown,
  customFilters?: Record<string, unknown>,
) {
  const filters: SalesFilterDto = {
    reportDateFrom:  customFilters?.reportDateFrom  as string | undefined,
    reportDateTo:    customFilters?.reportDateTo    as string | undefined,
    areaName:        customFilters?.areaName        as string | undefined,
    supervisorName:  customFilters?.supervisorName  as string | undefined,
    distributorName: customFilters?.distributorName as string | undefined,
    repName:         customFilters?.repName         as string | undefined,
    rootName:        customFilters?.rootName        as string | undefined,
    outletType:      customFilters?.outletType      as string | undefined,
    grossMin:        customFilters?.grossMin != null ? Number(customFilters.grossMin) : undefined,
    grossMax:        customFilters?.grossMax != null ? Number(customFilters.grossMax) : undefined,
    netMin:          customFilters?.netMin   != null ? Number(customFilters.netMin)   : undefined,
    netMax:          customFilters?.netMax   != null ? Number(customFilters.netMax)   : undefined,
  }

  return useQuery({
    queryKey: salesKeys.list({ page, pageSize, filters }),
    queryFn: async () => {
      const result = await getSalesAction({ filters, page, pageSize })
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

;(useSalesDataTable as unknown as Record<string, unknown>).isQueryHook = true

export function useSalesFilterOptionsByArea(areaName: string | undefined) {
  return useQuery({
    queryKey: ['sales', 'filter-options-by-area', areaName],
    queryFn: async (): Promise<SalesAreaFilterOptions> => {
      const result = await getSalesFilterOptionsByAreaAction({ areaName: areaName! })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!areaName,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSalesRoutesByArea(areaName: string | undefined) {
  return useQuery({
    queryKey: ['sales', 'routes-by-area', areaName],
    queryFn: async (): Promise<string[]> => {
      const result = await getSalesRoutesByAreaAction({ areaName: areaName! })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!areaName,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSalesMapPoints(filters: SalesFilterDto) {
  return useQuery({
    queryKey: salesKeys.list({ type: 'map', filters }),
    queryFn: async (): Promise<SalesMapPoint[]> => {
      const result = await getSalesMapPointsAction({ filters })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!filters.areaName,
    placeholderData: keepPreviousData,
  })
}

export function useSalesMissingLocationSummary(filters: SalesFilterDto) {
  return useQuery({
    queryKey: salesKeys.list({ type: 'missing-location', filters }),
    queryFn: async (): Promise<MissingLocationSummary> => {
      const result = await getSalesMissingLocationSummaryAction({ filters })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!filters.areaName,
    placeholderData: keepPreviousData,
  })
}

export function useSalesMapPointsForAreas(
  areas: string[],
  dateFrom?: string,
  dateTo?: string,
) {
  return useQueries({
    queries: areas.map((area) => ({
      queryKey: salesKeys.list({ type: 'map', filters: { areaName: area, reportDateFrom: dateFrom, reportDateTo: dateTo } }),
      queryFn: async (): Promise<{ area: string; outlets: SalesMapPoint[] }> => {
        const result = await getSalesMapPointsAction({ filters: { areaName: area, reportDateFrom: dateFrom, reportDateTo: dateTo } })
        if (!result.success) throw new Error(result.error)
        // Guarantee the declared array contract: an area with no map points
        // can come back with an undefined payload, which would crash consumers
        // that iterate `outlets` (e.g. conflict-page grouping).
        return { area, outlets: result.data ?? [] }
      },
      enabled: !!area && !!dateFrom && !!dateTo,
      placeholderData: keepPreviousData,
      staleTime: 2 * 60 * 1000,
    })),
  })
}

export function useSalesRoutesForAreas(areas: string[]) {
  return useQueries({
    queries: areas.map((area) => ({
      queryKey: ['sales', 'routes-by-area', area] as const,
      queryFn: async (): Promise<{ area: string; routes: string[] }> => {
        const result = await getSalesRoutesByAreaAction({ areaName: area })
        if (!result.success) throw new Error(result.error)
        return { area, routes: result.data ?? [] }
      },
      enabled: !!area,
      staleTime: 5 * 60 * 1000,
    })),
  })
}

export function useRouteConflicts(filters: ConflictFilterDto | null) {
  return useQuery({
    queryKey: ['sales', 'conflicts', filters],
    queryFn: async (): Promise<RouteConflict[]> => {
      const result = await getRouteConflictsAction(filters!)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!filters && !!filters.areaName && !!filters.dateFrom && !!filters.dateTo,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  })
}

export function useSalesImportHistory() {
  return useQuery({
    queryKey: ['sales', 'import-history'] as const,
    queryFn: async (): Promise<ImportHistoryRow[]> => {
      const result = await getSalesImportHistoryAction()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

export function useDeleteSalesImport() {
  const queryClient = useQueryClient()
  const { close } = useManageImportsDialog()

  return useMutation({
    mutationFn: async (importFileName: string) => {
      const result = await deleteSalesImportAction({ importFileName })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all })
      queryClient.invalidateQueries({ queryKey: ['sales', 'import-history'] })
      toast.success(`Deleted ${data.deleted} records`)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

export function useImportSales() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, reportDate }: { file: File; reportDate: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('reportDate', reportDate)
      const res = await fetch('/api/sales/import', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Import failed' }))
        throw new Error(err.error ?? 'Import failed')
      }
      return res.json() as Promise<{ inserted: number; reportDate: string }>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all })
      toast.success(`Imported ${data.inserted} records for ${data.reportDate}`)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
