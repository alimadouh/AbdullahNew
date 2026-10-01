import React, { useEffect, useRef, useState } from 'react'
import { ZoomIn, RotateCcw } from 'lucide-react'

// A picture you can zoom with two fingers (or the mouse wheel) without zooming the page.
// Pinch to zoom, drag to move when zoomed, double-tap to zoom in / back out.
const MIN = 1, MAX = 5

export default function ZoomImage({ src, alt, className = '', imgClassName = '' }) {
  const boxRef = useRef(null)
  const [t, setT] = useState({ s: 1, x: 0, y: 0 })
  const tRef = useRef(t)
  const pts = useRef(new Map())
  const gesture = useRef(null)
  const lastTap = useRef({ time: 0, x: 0, y: 0 })

  const apply = (next) => {
    const box = boxRef.current
    const s = Math.min(MAX, Math.max(MIN, next.s))
    // Keep the picture covering its box: no dragging it away past its edges
    const w = box?.clientWidth || 0, h = box?.clientHeight || 0
    const mx = ((s - 1) * w) / 2, my = ((s - 1) * h) / 2
    const v = s === 1 ? { s, x: 0, y: 0 } : { s, x: Math.min(mx, Math.max(-mx, next.x)), y: Math.min(my, Math.max(-my, next.y)) }
    tRef.current = v
    setT(v)
  }

  // Zoom to scale s while the point p (relative to the box centre) stays under the finger
  const zoomAt = (s, px, py, from = tRef.current) => {
    const k = Math.min(MAX, Math.max(MIN, s)) / from.s
    apply({ s: from.s * k, x: px - (px - from.x) * k, y: py - (py - from.y) * k })
  }

  const local = (e) => {
    const r = boxRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 }
  }

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    // Mouse wheel / trackpad pinch zooms the picture, not the page
    const onWheel = (e) => {
      e.preventDefault()
      const p = local(e)
      zoomAt(tRef.current.s * Math.exp(-e.deltaY * 0.0022), p.x, p.y)
    }
    // iOS Safari: stop its own page zoom gesture on the picture
    const stop = (e) => e.preventDefault()
    box.addEventListener('wheel', onWheel, { passive: false })
    box.addEventListener('gesturestart', stop)
    box.addEventListener('gesturechange', stop)
    return () => {
      box.removeEventListener('wheel', onWheel)
      box.removeEventListener('gesturestart', stop)
      box.removeEventListener('gesturechange', stop)
    }
  }, [])

  // A new picture starts unzoomed
  useEffect(() => { apply({ s: 1, x: 0, y: 0 }) }, [src])

  const startGesture = () => {
    const list = [...pts.current.values()]
    if (list.length >= 2) {
      const [a, b] = list
      gesture.current = { type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, from: tRef.current }
    } else if (list.length === 1) {
      gesture.current = { type: 'pan', start: list[0], from: tRef.current, moved: false }
    } else gesture.current = null
  }

  const onPointerDown = (e) => {
    boxRef.current.setPointerCapture?.(e.pointerId)
    pts.current.set(e.pointerId, local(e))
    startGesture()
  }

  const onPointerMove = (e) => {
    if (!pts.current.has(e.pointerId)) return
    pts.current.set(e.pointerId, local(e))
    const g = gesture.current
    if (!g) return
    const list = [...pts.current.values()]
    if (g.type === 'pinch' && list.length >= 2) {
      const [a, b] = list
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const s = g.from.s * (dist / g.dist)
      const k = Math.min(MAX, Math.max(MIN, s)) / g.from.s
      // zoom around the first midpoint, then follow the fingers as they move together
      apply({ s: g.from.s * k, x: g.mid.x - (g.mid.x - g.from.x) * k + (mid.x - g.mid.x), y: g.mid.y - (g.mid.y - g.from.y) * k + (mid.y - g.mid.y) })
    } else if (g.type === 'pan') {
      const p = list[0]
      const dx = p.x - g.start.x, dy = p.y - g.start.y
      if (Math.abs(dx) + Math.abs(dy) > 4) g.moved = true
      if (g.from.s > 1) apply({ s: g.from.s, x: g.from.x + dx, y: g.from.y + dy })
    }
  }

  const onPointerUp = (e) => {
    const g = gesture.current
    const p = pts.current.get(e.pointerId)
    pts.current.delete(e.pointerId)
    // Double-tap: zoom in where tapped, or back out
    if (g?.type === 'pan' && !g.moved && p && pts.current.size === 0) {
      const now = Date.now()
      const lt = lastTap.current
      if (now - lt.time < 320 && Math.hypot(p.x - lt.x, p.y - lt.y) < 30) {
        if (tRef.current.s > 1.05) apply({ s: 1, x: 0, y: 0 })
        else zoomAt(2.5, p.x, p.y)
        lastTap.current = { time: 0, x: 0, y: 0 }
      } else lastTap.current = { time: now, x: p.x, y: p.y }
    }
    startGesture()
  }

  const zoomed = t.s > 1.01
  return (
    <div
      ref={boxRef}
      className={`relative overflow-hidden select-none ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'} ${className}`}
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`pointer-events-none ${imgClassName}`}
        style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`, transition: gesture.current ? 'none' : 'transform .2s ease-out', willChange: 'transform' }}
      />
      {zoomed ? (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => apply({ s: 1, x: 0, y: 0 })}
          className="absolute right-2 bottom-2 flex h-8 items-center gap-1 rounded-full bg-slate-900/75 px-2.5 text-[11px] font-semibold text-white cursor-pointer"
          aria-label="Reset zoom"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {t.s.toFixed(1)}×
        </button>
      ) : (
        <span className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-slate-900/60 px-2 py-1 text-[10px] font-medium text-white">
          <ZoomIn className="h-3 w-3" /> Pinch to zoom
        </span>
      )}
    </div>
  )
}
