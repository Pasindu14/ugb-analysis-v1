"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateDialog,
  useEditDialog,
  useActivateDialog,
  useDeactivateDialog,
  useChangePasswordDialog,
} from "../../store";
import {
  useCreateUser,
  useUpdateUser,
  useActivateUser,
  useDeactivateUser,
  useUser,
  useChangePassword,
} from "../../hooks/users.hooks";
import { UserForm } from "../forms/users-form";
import { ChangePasswordDialogContent } from "./change-password-dialog";

// --- Create Dialog ---

function CreateUserDialog() {
  const { isOpen, close } = useCreateDialog();
  const { mutate, isPending, fieldErrors, clearFieldErrors } = useCreateUser();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close();
          clearFieldErrors();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>Add a new system user account.</DialogDescription>
        </DialogHeader>
        <UserForm
          mode="create"
          onSubmit={(data) => mutate(data)}
          isLoading={isPending}
          fieldErrors={fieldErrors}
        />
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Dialog ---

function EditUserDialog() {
  const { isOpen, selectedId, close } = useEditDialog();
  const { data: user, isLoading: isLoadingUser } = useUser(selectedId);
  const { mutate, isPending, fieldErrors, clearFieldErrors } = useUpdateUser();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close();
          clearFieldErrors();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user account details.</DialogDescription>
        </DialogHeader>
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : (
          <UserForm
            mode="edit"
            defaultValues={
              user
                ? {
                    email: user.email,
                    role: user.role,
                    employeeId: user.employeeId ?? undefined,
                  }
                : undefined
            }
            onSubmit={(data) => {
              if (!selectedId) return;
              mutate({ id: selectedId, data });
            }}
            isLoading={isPending}
            fieldErrors={fieldErrors}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Activate Dialog ---

function ActivateUserDialog() {
  const { isOpen, selectedId, close } = useActivateDialog();
  const { mutate, isPending } = useActivateUser();

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate User</AlertDialogTitle>
          <AlertDialogDescription>
            This user will be able to sign in again.
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
  );
}

// --- Deactivate Dialog ---

function DeactivateUserDialog() {
  const { isOpen, selectedId, close } = useDeactivateDialog();
  const { mutate, isPending } = useDeactivateUser();

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
          <AlertDialogDescription>
            This user will no longer be able to sign in.
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
  );
}

// --- Change Password Dialog ---

function ChangePasswordUserDialog() {
  const { isOpen, selectedId, close } = useChangePasswordDialog();
  const { mutate, isPending } = useChangePassword();

  return (
    <ChangePasswordDialogContent
      isOpen={isOpen}
      onClose={close}
      onSubmit={(password) =>
        selectedId && mutate({ id: selectedId, password })
      }
      isPending={isPending}
    />
  );
}

// --- Combined export ---

export function UserDialogs() {
  return (
    <>
      <CreateUserDialog />
      <EditUserDialog />
      <ActivateUserDialog />
      <DeactivateUserDialog />
      <ChangePasswordUserDialog />
    </>
  );
}
