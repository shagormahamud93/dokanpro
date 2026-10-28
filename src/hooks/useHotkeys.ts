import { useEffect, useRef } from 'react'

export interface HotkeyHandler {
  /** Lowercase key, or special: f1..f12, enter, escape, arrowup, arrowdown, +, -, ?, delete */
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  /** when true, runs even if focus is in an input */
  allowInInput?: boolean
  handler: (e: KeyboardEvent) => void
  description?: string
}

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}

/**
 * Global keyboard shortcut binder. Stable across renders thanks to a ref —
 * handlers can change every render without rebinding the listener.
 */
export function useHotkeys(handlers: HotkeyHandler[], enabled = true) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      const editable = isEditable(e.target)
      const key = e.key.toLowerCase()

      for (const h of handlersRef.current) {
        if (h.key.toLowerCase() !== key) continue
        if (!!h.ctrl !== (e.ctrlKey || e.metaKey)) continue
        if (!!h.shift !== e.shiftKey) continue
        if (!!h.alt !== e.altKey) continue
        if (editable && !h.allowInInput) continue
        h.handler(e)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
