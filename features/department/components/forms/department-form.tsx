'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDepartmentSchema, updateDepartmentSchema } from '../../schemas/department.schema'
import type { CreateDepartmentDto } from '../../schemas/department.schema'
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
import { Spinner } from '@/components/ui/spinner'

const updateFormSchema = updateDepartmentSchema.omit({ id: true })

interface DepartmentFormProps {
  mode:           'create' | 'edit'
  defaultValues?: Partial<CreateDepartmentDto>
  onSubmit:       (data: CreateDepartmentDto) => void
  isLoading:      boolean
  fieldErrors?:   Record<string, string> | null
}

export function DepartmentForm({
  mode,
  defaultValues,
  onSubmit,
  isLoading,
  fieldErrors,
}: DepartmentFormProps) {
  const schema = mode === 'create' ? createDepartmentSchema : updateFormSchema

  const form = useForm<CreateDepartmentDto>({
    resolver:      zodResolver(schema as typeof createDepartmentSchema),
    defaultValues: {
      name: '',
      ...defaultValues,
    },
  })

  const { setError } = form

  useEffect(() => {
    if (fieldErrors) {
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof CreateDepartmentDto, { message })
      })
    }
  }, [fieldErrors, setError])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. General, Packing, Printing..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Spinner className="mr-2" />
          ) : mode === 'create' ? (
            'Create Department'
          ) : (
            'Update Department'
          )}
        </Button>

      </form>
    </Form>
  )
}
