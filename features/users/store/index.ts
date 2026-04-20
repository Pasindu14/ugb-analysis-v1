import { useShallow } from 'zustand/react/shallow'
import { useUserDialogStore } from './users-dialog.store'

export { useUserDialogStore }

// --- Dialog selectors ---

export const useCreateDialog = () =>
  useUserDialogStore(
    useShallow((s) => ({
      isOpen: s.isCreateOpen,
      open:   s.openCreate,
      close:  s.closeCreate,
    }))
  )

export const useEditDialog = () =>
  useUserDialogStore(
    useShallow((s) => ({
      isOpen:     s.isEditOpen,
      selectedId: s.selectedUserId,
      open:       s.openEdit,
      close:      s.closeEdit,
    }))
  )

export const useActivateDialog = () =>
  useUserDialogStore(
    useShallow((s) => ({
      isOpen:     s.isActivateOpen,
      selectedId: s.selectedUserId,
      open:       s.openActivate,
      close:      s.closeActivate,
    }))
  )

export const useDeactivateDialog = () =>
  useUserDialogStore(
    useShallow((s) => ({
      isOpen:     s.isDeactivateOpen,
      selectedId: s.selectedUserId,
      open:       s.openDeactivate,
      close:      s.closeDeactivate,
    }))
  )

export const useChangePasswordDialog = () =>
  useUserDialogStore(
    useShallow((s) => ({
      isOpen:     s.isChangePasswordOpen,
      selectedId: s.selectedUserId,
      open:       s.openChangePassword,
      close:      s.closeChangePassword,
    }))
  )

