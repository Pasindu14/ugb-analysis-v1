import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DepartmentDialogState {
  isCreateOpen:     boolean
  isEditOpen:       boolean
  isActivateOpen:   boolean
  isDeactivateOpen: boolean
  selectedId:       number | null
  openCreate:      ()           => void
  closeCreate:     ()           => void
  openEdit:        (id: number) => void
  closeEdit:       ()           => void
  openActivate:    (id: number) => void
  closeActivate:   ()           => void
  openDeactivate:  (id: number) => void
  closeDeactivate: ()           => void
}

export const useDepartmentDialogStore = create<DepartmentDialogState>()(
  devtools(
    (set) => ({
      isCreateOpen:     false,
      isEditOpen:       false,
      isActivateOpen:   false,
      isDeactivateOpen: false,
      selectedId:       null,
      openCreate:      ()   => set({ isCreateOpen: true }),
      closeCreate:     ()   => set({ isCreateOpen: false }),
      openEdit:        (id) => set({ isEditOpen: true,        selectedId: id }),
      closeEdit:       ()   => set({ isEditOpen: false,       selectedId: null }),
      openActivate:    (id) => set({ isActivateOpen: true,    selectedId: id }),
      closeActivate:   ()   => set({ isActivateOpen: false,   selectedId: null }),
      openDeactivate:  (id) => set({ isDeactivateOpen: true,  selectedId: id }),
      closeDeactivate: ()   => set({ isDeactivateOpen: false, selectedId: null }),
    }),
    { name: 'DepartmentDialogStore' }
  )
)
