import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import ExcelJS from 'exceljs'
import { SalesService } from '@/features/sales/services/sales.service'
import type { AreaCustomerSaleInsert } from '@/db/schema'

export async function POST(req: NextRequest) {
  const session = await auth()
  const companyId = (session?.user as any)?.companyId as number | undefined
  if (!session?.user || !companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const ws = workbook.worksheets[0]
  if (!ws) {
    return NextResponse.json({ error: 'No worksheet found in file' }, { status: 400 })
  }

  const manualDate = (formData.get('reportDate') as string | null)?.trim() ?? ''
  let reportDate: string

  if (/^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
    reportDate = manualDate
  } else {
    // Fall back to extracting from row 3: "From: 2026-03-01  To: ..."
    const headerRow3 = ws.getRow(3).getCell(1).value?.toString() ?? ''
    const dateMatch  = headerRow3.match(/From:\s*(\d{4}-\d{2}-\d{2})/)
    if (!dateMatch) {
      return NextResponse.json(
        { error: 'Cannot determine report date. Select a date or check the file format (expected "From: YYYY-MM-DD" in row 3).' },
        { status: 400 },
      )
    }
    reportDate = dateMatch[1]
  }

  const rows: AreaCustomerSaleInsert[] = []

  ws.eachRow((row, i) => {
    if (i < 7) return // skip header rows

    const vals = row.values as any[]
    const locationStr = vals[18]?.toString() ?? ''
    const [lat, lon]  = locationStr.split(',').map(Number)

    rows.push({
      companyId,
      reportDate,
      areaName:        String(vals[2]  ?? '').trim(),
      supervisorCode:  Number(vals[3])  || 0,
      supervisorName:  String(vals[4]  ?? '').trim(),
      distributorCode: Number(vals[5])  || 0,
      distributorName: String(vals[6]  ?? '').trim(),
      divisionCode:    Number(vals[7])  || 0,
      divisionName:    String(vals[8]  ?? '').trim(),
      repCode:         Number(vals[9])  || 0,
      repName:         String(vals[10] ?? '').trim(),
      rootCode:        Number(vals[11]) || 0,
      rootName:        String(vals[12] ?? '').trim(),
      outletType:      String(vals[13] ?? '').trim(),
      customerCode:    Number(vals[14]) || 0,
      customerName:    String(vals[15] ?? '').trim(),
      grossSaleAmount: String(Number(vals[16]) || 0),
      netSaleAmount:   String(Number(vals[17]) || 0),
      latitude:        isNaN(lat) ? null : lat,
      longitude:       isNaN(lon) ? null : lon,
    })
  })

  try {
    const inserted = await SalesService.importPeriod(companyId, reportDate, rows)
    return NextResponse.json({ inserted, reportDate })
  } catch (err: any) {
    console.error('[sales/import]', err)
    return NextResponse.json({ error: 'Import failed. Please try again.' }, { status: 500 })
  }
}
