'use client'

import { useEffect } from 'react'

/**
 * Posts the document height to the parent window so the
 * host page (Wix, etc.) can resize the iframe dynamically.
 * Uses the same message shape as EmbedResizer.tsx.
 */
export function IframeResizer() {
  useEffect(() => {
    if (window === window.parent) return

    const sendHeight = () => {
      const height = document.body.scrollHeight
      window.parent.postMessage({ type: 'traverum-resize', height }, '*')
    }

    sendHeight()

    window.addEventListener('resize', sendHeight)
    const observer = new MutationObserver(sendHeight)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })

    const interval = setInterval(sendHeight, 1000)

    return () => {
      window.removeEventListener('resize', sendHeight)
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return null
}
