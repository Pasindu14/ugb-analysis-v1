import { useShallow } from 'zustand/react/shallow'
import { useSalesDialogStore } from './sales-dialog.store'

export { useSalesDialogStore }

export const useImportDialog = () =>
  useSalesDialogStore(
    useShallow((s) => ({
      isOpen: s.isImportOpen,
      open:   s.openImport,
      close:  s.closeImport,
    }))
  )

export const useManageImportsDialog = () =>
  useSalesDialogStore(
    useShallow((s) => ({
      isOpen: s.isManageImportsOpen,
      open:   s.openManageImports,
      close:  s.closeManageImports,
    }))
  )
