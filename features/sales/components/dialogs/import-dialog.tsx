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
import { Spinner } from '@/components/ui/spinner'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { useImportDialog } from '../../store'
import { useImportSales } from '../../hooks/sales.hooks'

export function ImportSalesDialog() {
  const { isOpen, close } = useImportDialog()
  const { mutate, isPending } = useImportSales()
  const inputRef  = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.xlsx')) setFile(dropped)
  }

  function handleSubmit() {
    if (!file) return
    mutate(file)
  }

  function handleClose() {
    if (isPending) return
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
    close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Sales Data</DialogTitle>
          <DialogDescription>
            Upload an Area Wise Customer Sale Excel (.xlsx) file. Existing data for the same period will be replaced.
          </DialogDescription>
        </DialogHeader>

        <div
          className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {file ? (
            <>
              <FileSpreadsheet className="h-10 w-10 text-primary" />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Drop your .xlsx file here or <span className="text-primary underline">browse</span>
              </p>
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isPending}>
            {isPending ? <><Spinner className="mr-2" /> Importing...</> : 'Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
