'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  Search,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/mahsulotlar', label: 'Mahsulotlar', icon: Package },
  { href: '/qidiruv', label: 'ID orqali qidirish', icon: Search },
  { href: '/mijozlar', label: 'Mijozlar', icon: Users },
  { href: '/tolovlar', label: 'To‘lovlar', icon: Wallet },
  { href: '/cheklar', label: 'Cheklar', icon: Receipt },
  { href: '/sozlamalar', label: 'Sozlamalar', icon: Settings },
]

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <ul className="flex flex-col gap-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2.5 text-sm font-semibold">
      <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        IS
      </span>
      Import Savdo
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-4 border-r bg-sidebar px-2 py-4 md:flex print:hidden">
        <Brand />
        <nav aria-label="Asosiy menyu">
          <NavLinks />
        </nav>
      </aside>

      <header className="sticky top-0 z-40 border-b bg-background md:hidden print:hidden">
        <div className="flex h-12 items-center justify-between px-2">
          <Brand />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-md hover:bg-muted"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {mobileOpen && (
          <nav id="mobile-nav" aria-label="Asosiy menyu" className="border-t px-2 py-2">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </nav>
        )}
      </header>

      <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
