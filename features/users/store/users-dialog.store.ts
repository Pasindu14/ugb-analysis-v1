import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UserDialogState {
  isCreateOpen:         boolean
  isEditOpen:           boolean
  isActivateOpen:       boolean
  isDeactivateOpen:     boolean
  isChangePasswordOpen: boolean
  selectedUserId:       number | null
  openCreate:          ()           => void
  closeCreate:         ()           => void
  openEdit:            (id: number) => void
  closeEdit:           ()           => void
  openActivate:        (id: number) => void
  closeActivate:       ()           => void
  openDeactivate:      (id: number) => void
  closeDeactivate:     ()           => void
  openChangePassword:  (id: number) => void
  closeChangePassword: ()           => void
}

export const useUserDialogStore = create<UserDialogState>()(
  devtools(
    (set) => ({
      isCreateOpen:         false,
      isEditOpen:           false,
      isActivateOpen:       false,
      isDeactivateOpen:     false,
      isChangePasswordOpen: false,
      selectedUserId:       null,
      openCreate:          ()   => set({ isCreateOpen: true }),
      closeCreate:         ()   => set({ isCreateOpen: false }),
      openEdit:            (id) => set({ isEditOpen: true,           selectedUserId: id }),
      closeEdit:           ()   => set({ isEditOpen: false,          selectedUserId: null }),
      openActivate:        (id) => set({ isActivateOpen: true,       selectedUserId: id }),
      closeActivate:       ()   => set({ isActivateOpen: false,      selectedUserId: null }),
      openDeactivate:      (id) => set({ isDeactivateOpen: true,     selectedUserId: id }),
      closeDeactivate:     ()   => set({ isDeactivateOpen: false,    selectedUserId: null }),
      openChangePassword:  (id) => set({ isChangePasswordOpen: true,  selectedUserId: id }),
      closeChangePassword: ()   => set({ isChangePasswordOpen: false, selectedUserId: null }),
    }),
    { name: 'UserDialogStore' }
  )
)
