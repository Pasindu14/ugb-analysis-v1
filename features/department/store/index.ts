import { useShallow } from 'zustand/react/shallow'
import { useDepartmentDialogStore } from './department-dialog.store'
import { useDepartmentFilterStore } from './department-filter.store'

export { useDepartmentDialogStore }
export { useDepartmentFilterStore }

// --- Dialog selectors ---

export const useCreateDialog = () =>
  useDepartmentDialogStore(
    useShallow((s) => ({
      isOpen: s.isCreateOpen,
      open:   s.openCreate,
      close:  s.closeCreate,
    }))
  )

export const useEditDialog = () =>
  useDepartmentDialogStore(
    useShallow((s) => ({
      isOpen:     s.isEditOpen,
      selectedId: s.selectedId,
      open:       s.openEdit,
      close:      s.closeEdit,
    }))
  )

export const useActivateDialog = () =>
  useDepartmentDialogStore(
    useShallow((s) => ({
      isOpen:     s.isActivateOpen,
      selectedId: s.selectedId,
      open:       s.openActivate,
      close:      s.closeActivate,
    }))
  )

export const useDeactivateDialog = () =>
  useDepartmentDialogStore(
    useShallow((s) => ({
      isOpen:     s.isDeactivateOpen,
      selectedId: s.selectedId,
      open:       s.openDeactivate,
      close:      s.closeDeactivate,
    }))
  )
