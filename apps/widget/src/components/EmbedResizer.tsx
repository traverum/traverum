'use client'

import { useEffect } from 'react'

/**
 * Client-only component that runs after hydration.
 * Adds embed-section class and sets up iframe height postMessage.
 * Must not run during SSR or initial hydration to avoid hydration mismatch.
 */
export function EmbedResizer() {
  useEffect(() => {
    document.body.classList.add('embed-section')
    document.documentElement.classList.add('embed-section')

    const sendHeight = () => {
      const height = document.body.scrollHeight
      window.parent.postMessage({ type: 'traverum-resize', height }, '*')
    }
    sendHeight()

    window.addEventListener('resize', sendHeight)
    const observer = new MutationObserver(sendHeight)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.body.classList.remove('embed-section')
      document.documentElement.classList.remove('embed-section')
      window.removeEventListener('resize', sendHeight)
      observer.disconnect()
    }
  }, [])

  return null
}
