import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UserFilterState {
  search:       string
  page:         number
  pageSize:     number
  statusFilter: string
  setSearch:       (search: string)   => void
  setPage:         (page: number)     => void
  setPageSize:     (pageSize: number) => void
  setStatusFilter: (status: string)   => void
  resetFilters:    ()                 => void
}

const defaultState = {
  search:       '',
  page:         1,
  pageSize:     10,
  statusFilter: '',
}

export const useUserFilterStore = create<UserFilterState>()(
  devtools(
    (set) => ({
      ...defaultState,
      setSearch:       (search)       => set({ search, page: 1 }),
      setPage:         (page)         => set({ page }),
      setPageSize:     (pageSize)     => set({ pageSize, page: 1 }),
      setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
      resetFilters:    ()             => set(defaultState),
    }),
    { name: 'UserFilterStore' }
  )
)
