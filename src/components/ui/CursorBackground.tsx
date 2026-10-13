'use client'

import { useEffect, useRef } from 'react'

/**
 * CursorBackground
 *
 * Dark mode  → Deep navy #07061a, purple/indigo particle network
 * Light mode → Pure white #ffffff, vivid colourful particle network
 *
 * Both modes:
 *  • Floating dots connected by lines when close
 *  • Mouse attracts nearby dots + draws extra connection lines
 *  • 3 aurora blobs drifting slowly
 *  • Cursor glow ring
 *  • Respects prefers-reduced-motion
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

    // ── helpers ──────────────────────────────────────────────────────────────
    const isDark = () => document.documentElement.classList.contains('dark')

    // ── resize ───────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── mouse ────────────────────────────────────────────────────────────────
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMove)

    // ── theme colours ─────────────────────────────────────────────────────────
    const THEME = {
      dark: {
        bg: '#07061a',
        blobColors: ['99,102,241', '139,92,246', '59,130,246'],
        blobOpacity: 0.22,
        particleColor: 'rgba(200,190,255,0.85)',
        particleShadow: 'rgba(139,92,246,0.8)',
        lineColor: '148,130,255',
        mouseLineColor: '180,160,255',
        cursorGlow1: 'rgba(167,139,250,0.35)',
        cursorGlow2: 'rgba(139,92,246,0.12)',
        cursorDot: 'rgba(220,210,255,0.9)',
        cursorShadow: 'rgba(139,92,246,1)',
        spotColor: 'rgba(167,139,250,0.18)',
      },
      light: {
        bg: '#ffffff',
        blobColors: ['20,184,166', '139,92,246', '236,72,153'],   // teal, violet, pink
        blobOpacity: 0.13,
        particleColor: 'rgba(80,60,180,0.75)',
        particleShadow: 'rgba(99,102,241,0.6)',
        lineColor: '99,102,241',
        mouseLineColor: '20,184,166',
        cursorGlow1: 'rgba(20,184,166,0.25)',
        cursorGlow2: 'rgba(99,102,241,0.10)',
        cursorDot: 'rgba(20,184,166,0.95)',
        cursorShadow: 'rgba(20,184,166,1)',
        spotColor: 'rgba(99,102,241,0.10)',
      },
    }

    // ── aurora blobs ──────────────────────────────────────────────────────────
    interface Blob { x: number; y: number; vx: number; vy: number; r: number; ci: number }
    const blobs: Blob[] = [
      { x: canvas.width * 0.20, y: canvas.height * 0.30, vx:  0.18, vy:  0.12, r: 420, ci: 0 },
      { x: canvas.width * 0.75, y: canvas.height * 0.60, vx: -0.14, vy:  0.16, r: 380, ci: 1 },
      { x: canvas.width * 0.50, y: canvas.height * 0.80, vx:  0.10, vy: -0.18, r: 340, ci: 2 },
    ]

    // ── particles ─────────────────────────────────────────────────────────────
    interface Particle { x: number; y: number; vx: number; vy: number; baseVx: number; baseVy: number; r: number }
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

    const LINK_DIST  = 140
    const MOUSE_DIST = 180
    const MOUSE_FORCE = 0.04

    // ── animation ─────────────────────────────────────────────────────────────
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const W = canvas.width
      const H = canvas.height
      const dark = isDark()
      const T = dark ? THEME.dark : THEME.light

      // Background
      ctx.fillStyle = T.bg
      ctx.fillRect(0, 0, W, H)

      // Aurora blobs
      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy
        if (b.x < -b.r || b.x > W + b.r) b.vx *= -1
        if (b.y < -b.r || b.y > H + b.r) b.vy *= -1
        const col = T.blobColors[b.ci]
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0,   `rgba(${col},${T.blobOpacity})`)
        g.addColorStop(0.5, `rgba(${col},${T.blobOpacity * 0.4})`)
        g.addColorStop(1,   `rgba(${col},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Update particles
      particles.forEach(p => {
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_DIST && dist > 1) {
          p.vx += (dx / dist) * MOUSE_FORCE
          p.vy += (dy / dist) * MOUSE_FORCE
        } else {
          p.vx += (p.baseVx - p.vx) * 0.02
          p.vy += (p.baseVy - p.vy) * 0.02
        }
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 1.8) { p.vx = (p.vx / speed) * 1.8; p.vy = (p.vy / speed) * 1.8 }
        p.x += p.vx; p.y += p.vy
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10
      })

      // Connection lines between particles
      ctx.lineWidth = 0.6
      for (let i = 0; i < COUNT; i++) {
        const a = particles[i]
        for (let j = i + 1; j < COUNT; j++) {
          const b = particles[j]
          const dx = a.x - b.x; const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * (dark ? 0.55 : 0.35)
            ctx.strokeStyle = `rgba(${T.lineColor},${alpha})`
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          }
        }
      }

      // Mouse connection lines (brighter)
      ctx.lineWidth = 0.9
      particles.forEach(p => {
        const dx = mouse.x - p.x; const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_DIST) {
          const alpha = (1 - dist / MOUSE_DIST) * (dark ? 0.75 : 0.55)
          ctx.strokeStyle = `rgba(${T.mouseLineColor},${alpha})`
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke()
        }
      })

      // Particle dots
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = T.particleColor
        ctx.shadowBlur = dark ? 6 : 5
        ctx.shadowColor = T.particleShadow
        ctx.fill()
      })
      ctx.shadowBlur = 0

      // Spotlight at cursor
      const sg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200)
      sg.addColorStop(0, T.spotColor)
      sg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = sg
      ctx.fillRect(0, 0, W, H)

      // Cursor glow ring
      const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80)
      cg.addColorStop(0,   T.cursorGlow1)
      cg.addColorStop(0.4, T.cursorGlow2)
      cg.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = cg
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2); ctx.fill()

      // Cursor dot
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2)
      ctx.fillStyle  = T.cursorDot
      ctx.shadowBlur = 14
      ctx.shadowColor = T.cursorShadow
      ctx.fill()
      ctx.shadowBlur = 0
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
