import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface SalesDialogState {
  isImportOpen: boolean
  openImport:  () => void
  closeImport: () => void
}

export const useSalesDialogStore = create<SalesDialogState>()(
  devtools(
    (set) => ({
      isImportOpen: false,
      openImport:  () => set({ isImportOpen: true }),
      closeImport: () => set({ isImportOpen: false }),
    }),
    { name: 'SalesDialogStore' }
  )
)
