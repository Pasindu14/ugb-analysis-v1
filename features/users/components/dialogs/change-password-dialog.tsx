'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { changePasswordSchema } from '../../schemas/users.schema'
import { z } from 'zod'

const formSchema = changePasswordSchema.pick({ password: true })
type FormValues = z.infer<typeof formSchema>

interface ChangePasswordDialogContentProps {
  isOpen:    boolean
  onClose:   () => void
  onSubmit:  (password: string) => void
  isPending: boolean
}

export function ChangePasswordDialogContent({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: ChangePasswordDialogContentProps) {
  const form = useForm<FormValues>({
    resolver:      zodResolver(formSchema),
    defaultValues: { password: '' },
  })

  function handleSubmit(values: FormValues) {
    onSubmit(values.password)
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Set a new password for this user account.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Spinner className="mr-2" /> : null}
              {isPending ? 'Saving...' : 'Change Password'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
