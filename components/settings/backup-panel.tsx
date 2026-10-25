'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Panel } from '@/components/common'
import { exportBackup, importBackup, parseBackup } from '@/lib/repository'
import { todayISO } from '@/lib/format'
import type { BackupFile } from '@/lib/schemas'

const MAX_BACKUP_BYTES = 200 * 1024 * 1024

export function BackupPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [pending, setPending] = useState<BackupFile | null>(null)

  async function handleExport() {
    setExporting(true)
    try {
      const backup = await exportBackup()
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `import-savdo-zaxira-${todayISO()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${backup.orders.length} ta buyurtma eksport qilindi`)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setExporting(false)
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_BACKUP_BYTES) {
      toast.error('Fayl juda katta')
      return
    }
    try {
      const raw: unknown = JSON.parse(await file.text())
      setPending(parseBackup(raw))
    } catch (error) {
      toast.error(error instanceof SyntaxError ? 'Fayl JSON formatida emas' : (error as Error).message)
    }
  }

  async function confirmImport() {
    if (!pending) return
    setImporting(true)
    try {
      await importBackup(pending)
      toast.success(`${pending.orders.length} ta buyurtma tiklandi`)
      setPending(null)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Panel>
      <h2 className="border-b px-4 py-3 text-sm font-medium">Zaxira nusxa</h2>
      <div className="grid gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          Barcha ma’lumotlar faqat shu brauzerda saqlanadi. Muntazam ravishda zaxira nusxa oling — brauzer ma’lumotlari
          tozalansa, ular yo‘qoladi.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Download data-icon="inline-start" />}
            Eksport (JSON)
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload data-icon="inline-start" />
            Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleFile}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && !importing && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ma’lumotlarni almashtirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Zaxirada {pending?.orders.length ?? 0} ta buyurtma va {pending?.receipts.length ?? 0} ta chek bor. Hozirgi
              barcha buyurtmalar va cheklar o‘chirilib, zaxiradagilar bilan almashtiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmImport} disabled={importing}>
              {importing && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Almashtirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  )
}
