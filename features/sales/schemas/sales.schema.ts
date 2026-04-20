import { z } from 'zod'

export const salesFilterSchema = z.object({
  reportDateFrom:  z.string().optional(),
  reportDateTo:    z.string().optional(),
  areaName:        z.string().optional(),
  supervisorName:  z.string().optional(),
  distributorName: z.string().optional(),
  repName:         z.string().optional(),
  rootName:        z.string().optional(),
  outletType:      z.string().optional(),
  grossMin:        z.coerce.number().optional(),
  grossMax:        z.coerce.number().optional(),
  netMin:          z.coerce.number().optional(),
  netMax:          z.coerce.number().optional(),
})

export type SalesFilterDto = z.infer<typeof salesFilterSchema>

export type SalesFilterOptions = {
  areaNames:        string[]
  supervisorNames:  string[]
  distributorNames: string[]
  repNames:         string[]
  rootNames:        string[]
  outletTypes:      string[]
  reportDates:      string[]
}
