import ExcelJS from 'exceljs'
import type { SalesMapPoint } from '../schemas/sales.schema'

interface ExportContext {
  reportDateFrom?: string
  reportDateTo?: string
  areaName?: string
}

interface AggregatedOutlet {
  customerCode:    number
  customerName:    string
  areaName:        string
  rootName:        string
  outletType:      string
  repName:         string
  supervisorName:  string
  distributorName: string
  totalGross:      number
  totalNet:        number
  billCount:       number
  reportDates:     string[]
}

function aggregateByOutlet(points: SalesMapPoint[]): AggregatedOutlet[] {
  const map = new Map<number, AggregatedOutlet>()

  for (const p of points) {
    const gross = Number(p.grossSaleAmount) || 0
    const net   = Number(p.netSaleAmount)   || 0
    const hasBill = gross > 0

    const existing = map.get(p.customerCode)
    if (existing) {
      existing.totalGross += gross
      existing.totalNet   += net
      if (hasBill && !existing.reportDates.includes(p.reportDate)) {
        existing.reportDates.push(p.reportDate)
        existing.billCount = existing.reportDates.length
      }
    } else {
      map.set(p.customerCode, {
        customerCode:    p.customerCode,
        customerName:    p.customerName,
        areaName:        p.areaName,
        rootName:        p.rootName,
        outletType:      p.outletType,
        repName:         p.repName,
        supervisorName:  p.supervisorName,
        distributorName: p.distributorName,
        totalGross:      gross,
        totalNet:        net,
        billCount:       hasBill ? 1 : 0,
        reportDates:     hasBill ? [p.reportDate] : [],
      })
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.areaName.localeCompare(b.areaName) || a.customerName.localeCompare(b.customerName),
  )
}

export async function exportOutletsToExcel(points: SalesMapPoint[], ctx: ExportContext) {
  const outlets = aggregateByOutlet(points)

  const workbook = new ExcelJS.Workbook()
  workbook.creator  = 'UGB Analysis'
  workbook.created  = new Date()

  const sheet = workbook.addWorksheet('Outlets')

  const rangeLabel =
    ctx.reportDateFrom && ctx.reportDateTo
      ? `${ctx.reportDateFrom} to ${ctx.reportDateTo}`
      : ctx.reportDateFrom ?? ctx.reportDateTo ?? 'All dates'

  sheet.mergeCells('A1:L1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = `Outlet Sales Export — ${ctx.areaName ?? 'All Areas'} — ${rangeLabel}`
  titleCell.font  = { bold: true, size: 13 }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 22

  sheet.getRow(3).values = [
    'Customer Code',
    'Customer Name',
    'Area',
    'Route',
    'Outlet Type',
    'Rep',
    'Supervisor',
    'Distributor',
    'Total Gross Sale',
    'Total Net Sale',
    'Bill Count',
    'Single Bill',
  ]
  const header = sheet.getRow(3)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.alignment = { vertical: 'middle' }
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left:   { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right:  { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  sheet.columns = [
    { key: 'customerCode',    width: 14 },
    { key: 'customerName',    width: 32 },
    { key: 'areaName',        width: 18 },
    { key: 'rootName',        width: 18 },
    { key: 'outletType',      width: 14 },
    { key: 'repName',         width: 20 },
    { key: 'supervisorName',  width: 20 },
    { key: 'distributorName', width: 22 },
    { key: 'totalGross',      width: 16 },
    { key: 'totalNet',        width: 16 },
    { key: 'billCount',       width: 11 },
    { key: 'singleBill',      width: 11 },
  ]

  outlets.forEach((o) => {
    const row = sheet.addRow({
      customerCode:    o.customerCode,
      customerName:    o.customerName,
      areaName:        o.areaName,
      rootName:        o.rootName,
      outletType:      o.outletType,
      repName:         o.repName,
      supervisorName:  o.supervisorName,
      distributorName: o.distributorName,
      totalGross:      o.totalGross,
      totalNet:        o.totalNet,
      billCount:       o.billCount,
      singleBill:      o.billCount === 1 ? 'Yes' : 'No',
    })
    row.getCell('totalGross').numFmt = '#,##0.00'
    row.getCell('totalNet').numFmt   = '#,##0.00'

    const singleBillCell = row.getCell('singleBill')
    if (o.billCount === 1) {
      singleBillCell.font = { color: { argb: 'FF15803D' }, bold: true }
    } else if (o.billCount === 0) {
      singleBillCell.font = { color: { argb: 'FF94A3B8' } }
    }
  })

  sheet.views = [{ state: 'frozen', ySplit: 3 }]
  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 12 } }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const stamp     = new Date().toISOString().slice(0, 10)
  const fileLabel = (ctx.areaName ?? 'all-areas').replace(/\s+/g, '-').toLowerCase()
  const fileName  = `outlets-${fileLabel}-${stamp}.xlsx`

  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
