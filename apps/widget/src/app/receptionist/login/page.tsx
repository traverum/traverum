'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get('redirect') || '/receptionist'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    error ? { type: 'error', text: 'Authentication failed. Please try again.' } : null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        router.push(redirectTo)
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm text-muted-foreground mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full h-11 px-4 text-sm rounded-xl border border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-muted-foreground mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-11 px-4 text-sm rounded-xl border border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full h-11 text-sm font-medium rounded-xl bg-accent text-accent-foreground hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {message && (
        <div className={`mt-5 p-3.5 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-success/10 text-success'
            : 'bg-destructive/10 text-destructive'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

function LoginFormFallback() {
  return (
    <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="space-y-5">
        <div className="h-11 bg-muted rounded-xl animate-pulse" />
        <div className="h-11 bg-muted rounded-xl animate-pulse" />
        <div className="h-11 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

export default function ReceptionistLoginPage() {
  return (
    <div className="veyond-theme receptionist-ui min-h-screen bg-background flex flex-col items-center justify-center px-5 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light text-foreground tracking-wide">Veyond</h1>
          <p className="mt-2 text-sm text-muted-foreground">Receptionist</p>
        </div>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Need an account? Ask your hotel manager or{' '}
          <a href="mailto:support@veyond.eu" className="underline hover:no-underline">
            contact Veyond
          </a>
        </p>
      </div>
    </div>
  )
}
