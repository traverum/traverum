'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, LogOut, Building2 } from 'lucide-react'

interface AvailableProperty {
  id: string
  slug: string
  display_name: string
}

interface ReceptionistNavProps {
  hotelName: string
  userName?: string
  availableProperties?: AvailableProperty[]
  activePropertyId?: string
}

const PROPERTY_COOKIE = 'traverum_receptionist_property'

function setPropertyCookie(propertyId: string) {
  const maxAge = 365 * 24 * 60 * 60
  document.cookie = `${PROPERTY_COOKIE}=${propertyId}; path=/receptionist; max-age=${maxAge}; SameSite=Lax`
}

export function ReceptionistNav({ hotelName, userName, availableProperties, activePropertyId }: ReceptionistNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const hasMultipleProperties = (availableProperties?.length ?? 0) >= 2

  const navItems = [
    { href: '/receptionist', label: 'Book' },
    { href: '/receptionist/bookings', label: 'Bookings' },
  ]

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/receptionist/logout', { method: 'POST' })
      router.push('/receptionist/login')
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  const handlePropertySwitch = (propertyId: string) => {
    if (propertyId === activePropertyId) return
    setPropertyCookie(propertyId)
    setShowDropdown(false)
    router.refresh()
  }

  return (
    <header className="bg-background">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/receptionist" className="text-lg font-light text-foreground tracking-wide">
              Veyond
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent/5 transition-colors"
            >
              <span className="hidden sm:inline">{hotelName}</span>
              <span className="sm:hidden">Menu</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl bg-card border border-border/50 py-2 shadow-lg">
                  {userName && (
                    <div className="px-4 py-2 text-xs text-muted-foreground">
                      {userName}
                    </div>
                  )}

                  {hasMultipleProperties && availableProperties && (
                    <div className="border-t border-border/50 mt-1 pt-1">
                      <div className="px-4 py-1.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Property
                      </div>
                      {availableProperties.map((property) => {
                        const isActive = property.id === activePropertyId
                        return (
                          <button
                            key={property.id}
                            onClick={() => handlePropertySwitch(property.id)}
                            className={`flex items-center gap-2.5 w-full px-4 py-2 text-left text-sm transition-colors ${
                              isActive
                                ? 'text-foreground font-medium bg-accent/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{property.display_name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="sm:hidden border-t border-border/50 mt-1 pt-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent/5 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-border/50 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {loggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
