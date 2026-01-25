'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface DashboardNavProps {
  hotelName: string
}

export function DashboardNav({ hotelName }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const navItems = [
    { href: '/dashboard/experiences', label: 'Experiences' },
    { href: '/dashboard/embed', label: 'Embed Setup' },
  ]

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/dashboard/logout', { method: 'POST' })
      router.push('/dashboard/login')
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Traverum
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Hotel dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-50"
            >
              <span className="hidden sm:inline">{hotelName}</span>
              <span className="sm:hidden">Menu</span>
              <svg
                className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  {/* Mobile nav items */}
                  <div className="sm:hidden border-b border-gray-100 pb-1 mb-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {loggingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
