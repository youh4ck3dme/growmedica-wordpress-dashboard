'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseHoverIntentOptions {
  openDelay?: number
  closeDelay?: number
  onOpen?: () => void
  onClose?: () => void
}

export function useHoverIntent({
  openDelay = 350,
  closeDelay = 200,
  onOpen,
  onClose,
}: UseHoverIntentOptions = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isIntent, setIsIntent] = useState(false)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearOpenTimer = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
  }, [])

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const open = useCallback(() => {
    clearCloseTimer()
    clearOpenTimer()
    setIsOpen(true)
    setIsIntent(false)
    onOpen?.()
  }, [clearCloseTimer, clearOpenTimer, onOpen])

  const close = useCallback(() => {
    clearOpenTimer()
    clearCloseTimer()
    setIsOpen(false)
    setIsIntent(false)
    onClose?.()
  }, [clearCloseTimer, clearOpenTimer, onClose])

  const handleEnter = useCallback(() => {
    clearCloseTimer()
    setIsIntent(true)
    clearOpenTimer()
    openTimer.current = setTimeout(open, openDelay)
  }, [clearCloseTimer, clearOpenTimer, open, openDelay])

  const handleLeave = useCallback(() => {
    clearOpenTimer()
    setIsIntent(false)
    clearCloseTimer()
    closeTimer.current = setTimeout(close, closeDelay)
  }, [clearCloseTimer, clearOpenTimer, close, closeDelay])

  useEffect(() => {
    return () => {
      clearOpenTimer()
      clearCloseTimer()
    }
  }, [clearOpenTimer, clearCloseTimer])

  return { isOpen, isIntent, handleEnter, handleLeave, open, close }
}
