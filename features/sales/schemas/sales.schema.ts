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

export type SalesAreaFilterOptions = {
  supervisorNames:  string[]
  distributorNames: string[]
  repNames:         string[]
  rootNames:        string[]
  outletTypes:      string[]
}

export type MissingLocationSummary = {
  count:     number
  totalSale: number
}

export type SalesMapPoint = {
  id:              number
  customerName:    string
  customerCode:    number
  areaName:        string
  outletType:      string
  latitude:        number
  longitude:       number
  grossSaleAmount: string
  netSaleAmount:   string
  repName:         string
  supervisorName:  string
  distributorName: string
  rootName:        string
  reportDate:      string
}
