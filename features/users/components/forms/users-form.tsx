'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, updateUserSchema } from '../../schemas/users.schema'
import type { CreateUserDto } from '../../schemas/users.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { ROLE_LABELS } from '../../constants'

const updateFormSchema = updateUserSchema.omit({ id: true })

interface UserFormProps {
  mode:           'create' | 'edit'
  defaultValues?: Partial<CreateUserDto>
  onSubmit:       (data: CreateUserDto) => void
  isLoading:      boolean
  fieldErrors?:   Record<string, string> | null
}

export function UserForm({
  mode,
  defaultValues,
  onSubmit,
  isLoading,
  fieldErrors,
}: UserFormProps) {
  const schema = mode === 'create' ? createUserSchema : updateFormSchema

  const form = useForm<CreateUserDto>({
    resolver:      zodResolver(schema as typeof createUserSchema),
    defaultValues: {
      email:      '',
      password:   '',
      role:       'employee',
      employeeId: undefined,
      ...defaultValues,
    },
  })

  const { setError } = form

  useEffect(() => {
    if (fieldErrors) {
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof CreateUserDto, { message })
      })
    }
  }, [fieldErrors, setError])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="user@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {mode === 'create' && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Employee ID <span className="text-muted-foreground text-xs">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Link to employee record"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Spinner className="mr-2" />
          ) : mode === 'create' ? (
            'Create User'
          ) : (
            'Update User'
          )}
        </Button>

      </form>
    </Form>
  )
}
