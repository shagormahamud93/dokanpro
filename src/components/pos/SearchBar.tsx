import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Search, ScanLine, Mic } from 'lucide-react'
import { Kbd } from '@/components/ui/Kbd'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  onEnter?: () => void
  onEscape?: () => void
}

export interface SearchBarHandle {
  focus: () => void
  clear: () => void
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(
  ({ value, onChange, onEnter, onEscape }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => onChange(''),
    }))

    return (
      <div className="group relative flex h-14 items-center rounded-md border border-border bg-surface shadow-sm transition-all duration-150 focus-within:border-primary focus-within:shadow-focus">
        <Search className="ml-4 h-5 w-5 text-text-muted group-focus-within:text-primary" />
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onEnter?.()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              if (value) onChange('')
              else onEscape?.()
            }
          }}
          placeholder="Search by name, scan barcode, or SKU..."
          className="flex-1 border-0 bg-transparent px-3 text-body-lg text-text placeholder:text-text-faint focus:outline-none focus:ring-0"
          aria-label="Product search"
        />
        <Kbd className="mr-2 hidden md:inline-flex">F1</Kbd>
        <button
          type="button"
          aria-label="Voice search"
          className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-sm text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <Mic className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Scan barcode"
          className="mr-2 inline-flex h-10 items-center gap-2 rounded-sm bg-primary-soft px-3 text-body-sm font-medium text-primary hover:bg-primary/15"
        >
          <ScanLine className="h-4 w-4" />
          Scan
        </button>
      </div>
    )
  },
)
SearchBar.displayName = 'SearchBar'
