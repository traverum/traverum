'use client'

import type { CSSProperties } from 'react'

interface RichTextProps {
  text: string
  className?: string
  style?: CSSProperties
}

/**
 * RichText component that formats plain text with paragraph breaks and lists.
 * Converts double newlines to paragraph breaks and detects list items (•, -, *, or numbered).
 */
export function RichText({ text, className = '', style }: RichTextProps) {
  // Split by double newlines to create paragraphs/blocks
  const blocks = text.split(/\n\n+/).filter(block => block.trim().length > 0)
  
  // Check if a line is a list item (bullet or numbered)
  const isListItem = (line: string): boolean => {
    const trimmed = line.trim()
    // Match: •, -, *, or numbered lists (1. 2. etc.)
    return /^[•\-\*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)
  }
  
  // Parse a block into paragraphs and lists
  const parseBlock = (block: string) => {
    const lines = block.split('\n').filter(line => line.trim().length > 0)
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let currentParagraph: string[] = []
    
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={`p-${elements.length}`} className="mb-4">
            {currentParagraph.join(' ')}
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
              // Remove bullet/number prefix (handle various formats)
              const trimmed = item.trim()
              const content = trimmed
                .replace(/^[•\-\*]\s+/, '')  // Remove bullet with space(s)
                .replace(/^\d+\.\s+/, '')   // Remove number with space(s)
              return (
                <li key={idx} className="pl-2">
                  {content}
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
