'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import {
  useCreateDialog,
  useEditDialog,
  useActivateDialog,
  useDeactivateDialog,
} from '../../store'
import {
  useCreateDepartment,
  useUpdateDepartment,
  useActivateDepartment,
  useDeactivateDepartment,
  useDepartment,
} from '../../hooks/department.hooks'
import { DepartmentForm } from '../forms/department-form'

// --- Create Dialog ---

function CreateDepartmentDialog() {
  const { isOpen, close } = useCreateDialog()
  const { mutate, isPending, fieldErrors, clearFieldErrors } = useCreateDepartment()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close()
          clearFieldErrors()
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
          <DialogDescription>Add a new department to your company.</DialogDescription>
        </DialogHeader>
        <DepartmentForm
          mode="create"
          onSubmit={(data) => mutate(data)}
          isLoading={isPending}
          fieldErrors={fieldErrors}
        />
      </DialogContent>
    </Dialog>
  )
}

// --- Edit Dialog ---

function EditDepartmentDialog() {
  const { isOpen, selectedId, close } = useEditDialog()
  const { data: department, isLoading: isLoadingDept } = useDepartment(selectedId)
  const { mutate, isPending, fieldErrors, clearFieldErrors } = useUpdateDepartment()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close()
          clearFieldErrors()
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department details.</DialogDescription>
        </DialogHeader>
        {isLoadingDept ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : (
          <DepartmentForm
            mode="edit"
            defaultValues={department ? { name: department.name } : undefined}
            onSubmit={(data) => {
              if (!selectedId) return
              mutate({ id: selectedId, data })
            }}
            isLoading={isPending}
            fieldErrors={fieldErrors}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- Activate Dialog ---

function ActivateDepartmentDialog() {
  const { isOpen, selectedId, close } = useActivateDialog()
  const { mutate, isPending } = useActivateDepartment()

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Department</AlertDialogTitle>
          <AlertDialogDescription>
            This will activate the department and make it available for use.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => selectedId && mutate(selectedId)}
          >
            {isPending ? <Spinner className="mr-2" /> : null}
            Activate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// --- Deactivate Dialog ---

function DeactivateDepartmentDialog() {
  const { isOpen, selectedId, close } = useDeactivateDialog()
  const { mutate, isPending } = useDeactivateDepartment()

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Department</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate the department. It can be reactivated at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => selectedId && mutate(selectedId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? <Spinner className="mr-2" /> : null}
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// --- Combined export ---

export function DepartmentDialogs() {
  return (
    <>
      <CreateDepartmentDialog />
      <EditDepartmentDialog />
      <ActivateDepartmentDialog />
      <DeactivateDepartmentDialog />
    </>
  )
}
