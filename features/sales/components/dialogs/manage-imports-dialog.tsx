'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FileSpreadsheet, Trash2, AlertTriangle } from 'lucide-react'
import { useManageImportsDialog } from '../../store'
import { useSalesImportHistory, useDeleteSalesImport } from '../../hooks/sales.hooks'

function ConfirmDelete({
  fileName,
  count,
  onConfirm,
  onCancel,
  isPending,
}: {
  fileName: string
  count: number
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-destructive">Delete {count.toLocaleString()} records?</p>
          <p className="mt-0.5 text-muted-foreground text-xs break-all">{fileName}</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
          {isPending ? <><Spinner className="mr-1.5" />Deleting…</> : 'Yes, delete'}
        </Button>
      </div>
    </div>
  )
}

export function ManageImportsDialog() {
  const { isOpen, close } = useManageImportsDialog()
  const { data: history = [], isFetching } = useSalesImportHistory()
  const { mutate: deleteImport, isPending } = useDeleteSalesImport()
  const [confirmingFile, setConfirmingFile] = useState<string | null>(null)

  function handleDelete(fileName: string) {
    deleteImport(fileName, {
      onSuccess: () => setConfirmingFile(null),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <FileSpreadsheet className="h-4 w-4 text-amber-500" />
            </div>
            Manage Imports
          </DialogTitle>
          <DialogDescription>
            View and delete previously imported data files. Deleting removes all records from that import.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
          {isFetching ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
              <Spinner />
              Loading import history…
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <FileSpreadsheet className="h-8 w-8 opacity-40" />
              <p className="text-sm">No imports found</p>
            </div>
          ) : (
            history.map((row) => {
              const name = row.importFileName ?? '(unknown)'
              const isConfirming = confirmingFile === name
              return (
                <div key={name} className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" title={name}>{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {row.recordCount.toLocaleString()} records · {row.reportDate} · imported{' '}
                        {new Date(row.importedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!isConfirming && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => setConfirmingFile(name)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {isConfirming && (
                    <div className="px-4 pb-3">
                      <ConfirmDelete
                        fileName={name}
                        count={row.recordCount}
                        onConfirm={() => handleDelete(name)}
                        onCancel={() => setConfirmingFile(null)}
                        isPending={isPending}
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={close}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
