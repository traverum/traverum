'use client'

import type { CSSProperties } from 'react'

interface RichTextProps {
  text: string
  className?: string
  style?: CSSProperties
}

/**
 * Converts **bold** markdown syntax to <strong> elements.
 * Returns an array of strings and JSX elements for inline rendering.
 */
function parseInline(text: string): (string | JSX.Element)[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/)
    if (bold) return <strong key={i}>{bold[1]}</strong>
    return part
  })
}

/**
 * RichText component that formats plain text with paragraph breaks, lists, and bold (**text**).
 * Converts double newlines to paragraph breaks and detects list items (•, -, *, or numbered).
 */
export function RichText({ text, className = '', style }: RichTextProps) {
  const blocks = text.split(/\n\n+/).filter(block => block.trim().length > 0)
  
  const isListItem = (line: string): boolean => {
    const trimmed = line.trim()
    return /^[•\-\*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)
  }
  
  const parseBlock = (block: string) => {
    const lines = block.split('\n').filter(line => line.trim().length > 0)
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let currentParagraph: string[] = []
    
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={`p-${elements.length}`} className="mb-4">
            {parseInline(currentParagraph.join(' '))}
          </p>
        )
        currentParagraph = []
      }
    }
    
    const flushList = () => {
      if (currentList.length > 0) {
        const isOrdered = /^\d+\.\s/.test(currentList[0].trim())
        const ListTag = isOrdered ? 'ol' : 'ul'
        elements.push(
          <ListTag key={`list-${elements.length}`} className="mb-4 ml-6 list-disc space-y-2">
            {currentList.map((item, idx) => {
              const trimmed = item.trim()
              const content = trimmed
                .replace(/^[•\-\*]\s+/, '')
                .replace(/^\d+\.\s+/, '')
              return (
                <li key={idx} className="pl-2">
                  {parseInline(content)}
                </li>
              )
            })}
          </ListTag>
        )
        currentList = []
      }
    }
    
    lines.forEach((line) => {
      if (isListItem(line)) {
        flushParagraph()
        currentList.push(line)
      } else {
        flushList()
        currentParagraph.push(line.trim())
      }
    })
    
    flushParagraph()
    flushList()
    
    return elements
  }
  
  return (
    <div className={className} style={style}>
      {blocks.map((block, blockIndex) => (
        <div key={blockIndex}>
          {parseBlock(block)}
        </div>
      ))}
    </div>
  )
}
