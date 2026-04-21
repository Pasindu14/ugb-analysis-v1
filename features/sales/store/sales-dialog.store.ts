import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface SalesDialogState {
  isImportOpen:        boolean
  isManageImportsOpen: boolean
  openImport:          () => void
  closeImport:         () => void
  openManageImports:   () => void
  closeManageImports:  () => void
}

export const useSalesDialogStore = create<SalesDialogState>()(
  devtools(
    (set) => ({
      isImportOpen:        false,
      isManageImportsOpen: false,
      openImport:          () => set({ isImportOpen: true }),
      closeImport:         () => set({ isImportOpen: false }),
      openManageImports:   () => set({ isManageImportsOpen: true }),
      closeManageImports:  () => set({ isManageImportsOpen: false }),
    }),
    { name: 'SalesDialogStore' }
  )
)
