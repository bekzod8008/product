'use client'

import { useId, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError, LoadingState, Panel, SegmentedFilter } from '@/components/common'
import { useSettings } from '@/lib/hooks'
import { saveSettings } from '@/lib/repository'
import { fieldErrors, settingsSchema, type SettingsFormValues } from '@/lib/schemas'
import type { Settings } from '@/lib/types'

function Form({ initial }: { initial: Settings }) {
  const id = useId()
  const [values, setValues] = useState<SettingsFormValues>({
    storeName: initial.storeName,
    phone: initial.phone,
    address: initial.address,
    receiptFooter: initial.receiptFooter,
    paperSize: initial.paperSize,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function update<K extends keyof SettingsFormValues>(key: K, value: SettingsFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = settingsSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setSaving(true)
    try {
      await saveSettings(parsed.data)
      toast.success('Sozlamalar saqlandi')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-storeName`}>Do‘kon nomi *</Label>
          <Input
            id={`${id}-storeName`}
            value={values.storeName}
            onChange={(e) => update('storeName', e.target.value)}
            aria-invalid={errors.storeName ? true : undefined}
            aria-describedby={errors.storeName ? `${id}-storeName-error` : undefined}
          />
          <FieldError id={`${id}-storeName-error`} message={errors.storeName} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-phone`}>Telefon</Label>
          <Input id={`${id}-phone`} type="tel" value={values.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-address`}>Manzil</Label>
        <Input id={`${id}-address`} value={values.address} onChange={(e) => update('address', e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-footer`}>Chek pastidagi matn</Label>
        <Textarea
          id={`${id}-footer`}
          rows={2}
          value={values.receiptFooter}
          onChange={(e) => update('receiptFooter', e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium">Standart qog‘oz o‘lchami</span>
        <div>
          <SegmentedFilter
            label="Standart qog‘oz o‘lchami"
            value={values.paperSize}
            onChange={(v) => update('paperSize', v)}
            options={[
              { value: 'thermal', label: 'Termal 80 mm' },
              { value: 'a4', label: 'A4' },
            ]}
          />
        </div>
      </div>
      <div>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Saqlash
        </Button>
      </div>
    </form>
  )
}

export function StoreSettingsForm() {
  const { settings, loading } = useSettings()
  return (
    <Panel>
      <h2 className="border-b px-4 py-3 text-sm font-medium">Do‘kon va chek</h2>
      {loading ? <LoadingState /> : <Form initial={settings} />}
    </Panel>
  )
}
