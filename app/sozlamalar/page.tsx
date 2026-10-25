import type { Metadata } from 'next'
import { PageHeader } from '@/components/common'
import { StoreSettingsForm } from '@/components/settings/store-settings-form'
import { BackupPanel } from '@/components/settings/backup-panel'

export const metadata: Metadata = { title: 'Sozlamalar — Import Savdo' }

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Sozlamalar" description="Chek ma’lumotlari va ma’lumotlar zaxirasi." />
      <div className="grid max-w-3xl gap-5">
        <StoreSettingsForm />
        <BackupPanel />
      </div>
    </>
  )
}
