import { useCallback, useEffect, useRef, useState } from 'react'

export type SwipeDir = 'left' | 'right' | 'up' | 'down'

export const SWIPE_RATING_GLOW: Record<SwipeDir, string> = {
  left: '#f87171',
  up: '#fb923c',
  right: '#4ade80',
  down: '#38bdf8',
}

export interface UseSwipeCardOptions {
  enabled?: boolean
  directions?: SwipeDir[]
  threshold?: number
  glowColors?: Partial<Record<SwipeDir, string>>
  onSwipe: (dir: SwipeDir) => void
  dismissMs?: number
  onDismissed?: (dir: SwipeDir) => void
  haptics?: boolean
}

export interface SwipeCardHandle {
  cardRef: React.RefObject<HTMLDivElement | null>
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
    onPointerCancel: (e: React.PointerEvent) => void
  }
  swipeDir: SwipeDir | null
  dismissDir: SwipeDir | null
  dismissClass: string
  animKey: number
  reset: () => void
  dismiss: (dir: SwipeDir) => void
}

const ALL_DIRS: SwipeDir[] = ['left', 'right', 'up', 'down']

export function useSwipeCard({
  enabled = true,
  directions = ALL_DIRS,
  threshold = 40,
  glowColors = SWIPE_RATING_GLOW,
  onSwipe,
  dismissMs = 300,
  onDismissed,
  haptics = true,
}: UseSwipeCardOptions): SwipeCardHandle {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const dismissTimer = useRef<number | null>(null)
  const [swipeDir, setSwipeDir] = useState<SwipeDir | null>(null)
  const [dismissDir, setDismissDir] = useState<SwipeDir | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const clearCardStyles = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transition = ''
      cardRef.current.style.transform = ''
      cardRef.current.style.boxShadow = ''
    }
  }, [])

  const reset = useCallback(() => {
    if (dismissTimer.current) {
      window.clearTimeout(dismissTimer.current)
      dismissTimer.current = null
    }
    touchStartRef.current = null
    setSwipeDir(null)
    setDismissDir(null)
    clearCardStyles()
  }, [clearCardStyles])

  useEffect(() => () => {
    if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
  }, [])

  const dismiss = useCallback((dir: SwipeDir) => {
    if (dismissDir) return
    if (haptics) navigator.vibrate?.(30)
    clearCardStyles()
    setSwipeDir(null)
    setDismissDir(dir)
    dismissTimer.current = window.setTimeout(() => {
      dismissTimer.current = null
      setDismissDir(null)
      setAnimKey(k => k + 1)
      onDismissed?.(dir)
    }, dismissMs)
  }, [clearCardStyles, dismissDir, dismissMs, haptics, onDismissed])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (dismissDir || pointerIdRef.current !== null) return
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
    if (cardRef.current) {
      cardRef.current.style.transition = 'none'
      cardRef.current.style.boxShadow = ''
    }
    setSwipeDir(null)
  }, [dismissDir])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || pointerIdRef.current !== null || !enabled || dismissDir) return
    if (e.cancelable) e.preventDefault()
    const t = e.touches[0]
    const dx = t.clientX - touchStartRef.current.x
    const dy = t.clientY - touchStartRef.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const dist = Math.sqrt(dx * dx + dy * dy)

    let dir: SwipeDir | null = null
    if (absDx > threshold || absDy > threshold) {
      dir = absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
    }
    if (dir && !directions.includes(dir)) dir = null

    if (cardRef.current) {
      const tiltX = Math.min(14, (dx / 200) * 14)
      const tiltY = Math.min(6, (dy / 300) * 6) * -0.3
      cardRef.current.style.transform =
        `translateX(${dx * 0.18}px) translateY(${dy * 0.08}px) rotate(${tiltX + tiltY}deg)`
      const color = dir ? glowColors[dir] : undefined
      if (dir && color) {
        const intensity = Math.min(1, (dist - threshold) / 120)
        const alpha = Math.round(intensity * 180).toString(16).padStart(2, '0')
        cardRef.current.style.boxShadow =
          `0 0 ${8 + 20 * intensity}px ${4 + 10 * intensity}px ${color}${alpha}`
      } else {
        cardRef.current.style.boxShadow = ''
      }
    }

    setSwipeDir(dir)
  }, [directions, dismissDir, enabled, glowColors, threshold])

  const onTouchEnd = useCallback(() => {
    const dir = swipeDir
    touchStartRef.current = null
    setSwipeDir(null)
    clearCardStyles()
    if (!dir || !enabled || dismissDir) return
    onSwipe(dir)
  }, [clearCardStyles, dismissDir, enabled, onSwipe, swipeDir])

  const updateGesture = useCallback((x: number, y: number) => {
    if (!touchStartRef.current || !enabled || dismissDir) return
    const dx = x - touchStartRef.current.x, dy = y - touchStartRef.current.y
    const absDx = Math.abs(dx), absDy = Math.abs(dy), dist = Math.hypot(dx, dy)
    let dir: SwipeDir | null = null
    if (absDx > threshold || absDy > threshold) dir = absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
    if (dir && !directions.includes(dir)) dir = null
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${dx * .18}px) translateY(${dy * .08}px) rotate(${Math.min(14, dx / 200 * 14)}deg)`
      const color = dir ? glowColors[dir] : undefined
      cardRef.current.style.boxShadow = color ? `0 0 ${8 + 20 * Math.min(1, (dist-threshold)/120)}px ${color}` : ''
    }
    setSwipeDir(dir)
  }, [directions, dismissDir, enabled, glowColors, threshold])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (dismissDir || (e.pointerType === 'mouse' && e.button !== 0)) return
    pointerIdRef.current = e.pointerId; touchStartRef.current = { x:e.clientX, y:e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId); setSwipeDir(null)
  }, [dismissDir])
  const onPointerMove = useCallback((e: React.PointerEvent) => { if(pointerIdRef.current===e.pointerId) updateGesture(e.clientX,e.clientY) }, [updateGesture])
  const finishPointer = useCallback((e: React.PointerEvent) => {
    if(pointerIdRef.current!==e.pointerId)return; const dir=swipeDir; pointerIdRef.current=null;touchStartRef.current=null;clearCardStyles();setSwipeDir(null)
    if(dir&&enabled&&!dismissDir)onSwipe(dir)
  },[clearCardStyles,dismissDir,enabled,onSwipe,swipeDir])

  return {
    cardRef,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onPointerDown, onPointerMove, onPointerUp: finishPointer, onPointerCancel: finishPointer },
    swipeDir,
    dismissDir,
    dismissClass: dismissDir ? `card-dismiss-${dismissDir}` : '',
    animKey,
    reset,
    dismiss,
  }
}
