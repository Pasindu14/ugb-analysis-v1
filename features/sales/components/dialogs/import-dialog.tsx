'use client'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react'
import { useImportDialog } from '../../store'
import { useImportSales } from '../../hooks/sales.hooks'

function getDefaultReportDate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

export function ImportSalesDialog() {
  const { isOpen, close } = useImportDialog()
  const { mutate, isPending } = useImportSales()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [reportDate, setReportDate] = useState(getDefaultReportDate)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.xlsx')) setFile(dropped)
  }

  function handleSubmit() {
    if (!file || !reportDate) return
    mutate({ file, reportDate })
  }

  function handleClose() {
    if (isPending) return
    setFile(null)
    setReportDate(getDefaultReportDate())
    if (inputRef.current) inputRef.current.value = ''
    close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Import Sales Data
          </DialogTitle>
          <DialogDescription>
            Upload an Area Wise Customer Sale Excel (.xlsx) file. Existing data for
            the same period will be replaced.
          </DialogDescription>
        </DialogHeader>

        <div
          className={[
            'relative mt-1 flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all duration-200 cursor-pointer select-none',
            isDragging
              ? 'border-primary/60 bg-primary/5'
              : file
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30',
          ].join(' ')}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
        >
          {file ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <FileSpreadsheet className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[260px]">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · Ready to import
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                File ready
              </div>
            </>
          ) : (
            <>
              <div
                className={[
                  'flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-200',
                  isDragging
                    ? 'bg-primary/10'
                    : 'bg-muted',
                ].join(' ')}
              >
                <Upload
                  className={[
                    'h-7 w-7 transition-colors duration-200',
                    isDragging ? 'text-primary' : 'text-muted-foreground',
                  ].join(' ')}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragging ? 'Drop to upload' : 'Drop your file here'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or{' '}
                  <span className="text-primary underline underline-offset-2">
                    click to browse
                  </span>{' '}
                  · .xlsx files only
                </p>
              </div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="import-report-date" className="text-sm font-medium">
            Report Date
          </Label>
          <Input
            id="import-report-date"
            type="date"
            className="h-9"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            All imported rows will be stored under this date.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || !reportDate || isPending}
            className="min-w-[100px]"
          >
            {isPending ? (
              <>
                <Spinner className="mr-2" /> Importing…
              </>
            ) : (
              'Import'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
