'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'

interface TranslatedFields {
  title: string
  description: string
  meetingPoint: string | null
}

interface TranslationCacheEntry extends TranslatedFields {
  loading: false
}

interface TranslationContextValue {
  language: string | null
  setLanguage: (lang: string | null) => void
  getTranslation: (experienceId: string) => TranslatedFields | null
  isTranslating: (experienceId: string) => boolean
  requestTranslation: (experienceId: string) => void
}

const TranslationContext = createContext<TranslationContextValue | null>(null)

const STORAGE_KEY = 'veyond-content-language'

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string | null>(null)

  // Sync from localStorage after mount so SSR and client first paint match (avoids hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setLanguageState(stored)
  }, [])

  const [cache, setCache] = useState<Map<string, TranslationCacheEntry>>(new Map())
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set())
  const inflightRef = useRef<Set<string>>(new Set())

  const setLanguage = useCallback((lang: string | null) => {
    setLanguageState(lang)
    if (lang) {
      localStorage.setItem(STORAGE_KEY, lang)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Clear cache when language changes
  useEffect(() => {
    setCache(new Map())
    setLoadingSet(new Set())
    inflightRef.current.clear()
  }, [language])

  const requestTranslation = useCallback((experienceId: string) => {
    if (!language) return

    const cacheKey = `${experienceId}:${language}`
    if (cache.has(cacheKey) || inflightRef.current.has(cacheKey)) return

    inflightRef.current.add(cacheKey)
    setLoadingSet(prev => new Set(prev).add(cacheKey))

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experienceId, targetLanguage: language }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`Translation failed: ${res.status}`)
        return res.json()
      })
      .then((data: TranslatedFields) => {
        setCache(prev => {
          const next = new Map(prev)
          next.set(cacheKey, {
            title: data.title,
            description: data.description,
            meetingPoint: data.meetingPoint,
            loading: false,
          })
          return next
        })
      })
      .catch(err => {
        console.error('Translation fetch error:', err)
      })
      .finally(() => {
        inflightRef.current.delete(cacheKey)
        setLoadingSet(prev => {
          const next = new Set(prev)
          next.delete(cacheKey)
          return next
        })
      })
  }, [language, cache])

  const getTranslation = useCallback((experienceId: string): TranslatedFields | null => {
    if (!language) return null
    const entry = cache.get(`${experienceId}:${language}`)
    return entry ?? null
  }, [language, cache])

  const isTranslating = useCallback((experienceId: string): boolean => {
    if (!language) return false
    return loadingSet.has(`${experienceId}:${language}`)
  }, [language, loadingSet])

  return (
    <TranslationContext.Provider value={{ language, setLanguage, getTranslation, isTranslating, requestTranslation }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider')
  return ctx
}
