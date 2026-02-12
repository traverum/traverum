'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface EmbedCodeBlockProps {
  code: string
  label: string
}

export function EmbedCodeBlock({ code, label }: EmbedCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button
          onClick={handleCopy}
          className={`h-7 px-3 rounded-sm text-sm font-medium transition-colors flex items-center gap-1.5 ${
            copied
              ? 'bg-success/10 text-[#6B8E6B]'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-[rgba(55,53,47,0.08)] text-foreground p-4 rounded-sm overflow-x-auto text-xs font-mono leading-relaxed border border-border">
        <code>{code}</code>
      </pre>
    </div>
  )
}
