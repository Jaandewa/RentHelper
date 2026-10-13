'use client'

import { useEffect, useRef } from 'react'

/**
 * CursorBackground
 *
 * Beautiful dark particle-network background:
 * ─ Deep dark base (navy/charcoal)
 * ─ 120 floating dots connected by lines when close
 * ─ Mouse attracts nearby particles + adds extra connection lines
 * ─ 3 large aurora colour blobs that drift slowly
 * ─ Respects prefers-reduced-motion
 */
export default function CursorBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef   = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── resize ───────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── mouse ────────────────────────────────────────────────────────────────
    const mouse = { x: -9999, y: -9999 }
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMove)

    // ── aurora blobs ─────────────────────────────────────────────────────────
    interface Blob {
      x: number; y: number
      vx: number; vy: number
      r: number
      color: string
    }
    const blobs: Blob[] = [
      { x: canvas.width * 0.2,  y: canvas.height * 0.3, vx: 0.18, vy: 0.12, r: 420, color: '99,102,241'  },
      { x: canvas.width * 0.75, y: canvas.height * 0.6, vx: -0.14, vy: 0.16, r: 380, color: '139,92,246' },
      { x: canvas.width * 0.5,  y: canvas.height * 0.8, vx: 0.10, vy: -0.18, r: 340, color: '59,130,246' },
    ]

    // ── particles ─────────────────────────────────────────────────────────────
    interface Particle {
      x: number; y: number
      vx: number; vy: number
      r: number
      baseVx: number; baseVy: number
    }

    const COUNT = 110
    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const vx = (Math.random() - 0.5) * 0.5
      const vy = (Math.random() - 0.5) * 0.5
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx, vy, baseVx: vx, baseVy: vy,
        r: Math.random() * 1.8 + 0.8,
      }
    })

    const LINK_DIST   = 140   // max distance to draw a line between particles
    const MOUSE_DIST  = 180   // mouse influence radius
    const MOUSE_FORCE = 0.04  // how strongly mouse pulls particles

    // ── animation ────────────────────────────────────────────────────────────
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const W = canvas.width
      const H = canvas.height

      // ── background fill ──────────────────────────────────────────────────
      ctx.fillStyle = '#07061a'   // very deep navy
      ctx.fillRect(0, 0, W, H)

      // ── aurora blobs ─────────────────────────────────────────────────────
      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy
        if (b.x < -b.r || b.x > W + b.r) b.vx *= -1
        if (b.y < -b.r || b.y > H + b.r) b.vy *= -1

        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0,   `rgba(${b.color},0.22)`)
        g.addColorStop(0.5, `rgba(${b.color},0.08)`)
        g.addColorStop(1,   `rgba(${b.color},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // ── particles + connections ──────────────────────────────────────────
      // Update positions with mouse attraction
      particles.forEach(p => {
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < MOUSE_DIST && dist > 1) {
          p.vx += (dx / dist) * MOUSE_FORCE
          p.vy += (dy / dist) * MOUSE_FORCE
        } else {
          // drift back to base velocity
          p.vx += (p.baseVx - p.vx) * 0.02
          p.vy += (p.baseVy - p.vy) * 0.02
        }

        // clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 1.8) { p.vx = (p.vx / speed) * 1.8; p.vy = (p.vy / speed) * 1.8 }

        p.x += p.vx; p.y += p.vy

        // wrap around edges
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10
      })

      // Draw connections between nearby particles
      ctx.lineWidth = 0.6
      for (let i = 0; i < COUNT; i++) {
        const a = particles[i]
        for (let j = i + 1; j < COUNT; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.55
            ctx.strokeStyle = `rgba(148,130,255,${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Draw mouse connections (brighter)
      if (mouse.x > 0) {
        particles.forEach(p => {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_DIST) {
            const alpha = (1 - dist / MOUSE_DIST) * 0.75
            ctx.strokeStyle = `rgba(180,160,255,${alpha})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        })
      }

      // Draw particles
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(200,190,255,0.85)'
        ctx.shadowBlur = 6
        ctx.shadowColor = 'rgba(139,92,246,0.8)'
        ctx.fill()
      })
      ctx.shadowBlur = 0

      // ── cursor glow ──────────────────────────────────────────────────────
      if (mouse.x > 0) {
        const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80)
        cg.addColorStop(0,   'rgba(167,139,250,0.35)')
        cg.addColorStop(0.4, 'rgba(139,92,246,0.12)')
        cg.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = cg
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2)
        ctx.fill()

        // tiny bright dot at exact cursor
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(220,210,255,0.9)'
        ctx.shadowBlur = 12
        ctx.shadowColor = 'rgba(139,92,246,1)'
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )
}
