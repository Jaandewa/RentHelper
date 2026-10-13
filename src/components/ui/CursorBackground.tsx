'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * CursorBackground
 *
 * Renders a full-page canvas behind all content.
 * – Soft glowing orbs that gently follow the cursor with lag
 * – Floating ambient particles that drift upward
 * – Subtle radial spotlight that tracks the mouse
 * Respects prefers-reduced-motion.
 */
export default function CursorBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const mx = mouseRef.current.x
    const my = mouseRef.current.y

    // ── Spotlight halo around cursor ────────────────────────────────────────
    if (mx > 0 && my > 0) {
      const spotGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 320)
      spotGrad.addColorStop(0, 'rgba(139, 92, 246, 0.10)')  // violet
      spotGrad.addColorStop(0.4, 'rgba(99, 102, 241, 0.05)')
      spotGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = spotGrad
      ctx.fillRect(0, 0, W, H)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Check reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── Resize ───────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Mouse tracking ───────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Floating particles ───────────────────────────────────────────────────
    interface Particle {
      x: number; y: number; r: number
      dx: number; dy: number
      opacity: number; dOpacity: number
      color: string
    }

    const COLORS = [
      '139,92,246',  // violet
      '99,102,241',  // indigo
      '59,130,246',  // blue
      '236,72,153',  // pink
      '16,185,129',  // emerald
    ]

    const makeParticle = (): Particle => {
      const W = canvas.width
      const H = canvas.height
      return {
        x: Math.random() * W,
        y: H + Math.random() * 100,
        r: Math.random() * 2.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: -(Math.random() * 0.5 + 0.2),
        opacity: 0,
        dOpacity: Math.random() * 0.005 + 0.002,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    const PARTICLE_COUNT = 60
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, makeParticle)
    // Spread initial positions vertically so they don't all start at the bottom
    particles.forEach(p => { p.y = Math.random() * canvas.height })

    // ── Glowing orbs that lazily follow cursor ───────────────────────────────
    interface Orb {
      x: number; y: number
      tx: number; ty: number   // target (mouse-offset)
      speed: number
      r: number
      color1: string; color2: string
      offsetX: number; offsetY: number  // fixed offset from cursor
    }

    const orbs: Orb[] = [
      {
        x: 0, y: 0, tx: 0, ty: 0, speed: 0.035, r: 280,
        color1: 'rgba(139,92,246,0.18)', color2: 'rgba(99,102,241,0)',
        offsetX: -80, offsetY: -60,
      },
      {
        x: 0, y: 0, tx: 0, ty: 0, speed: 0.025, r: 220,
        color1: 'rgba(236,72,153,0.14)', color2: 'rgba(236,72,153,0)',
        offsetX: 100, offsetY: 80,
      },
      {
        x: 0, y: 0, tx: 0, ty: 0, speed: 0.018, r: 340,
        color1: 'rgba(59,130,246,0.10)', color2: 'rgba(59,130,246,0)',
        offsetX: 40, offsetY: -140,
      },
    ]
    // initialise orb positions to center
    const cx = canvas.width / 2, cy = canvas.height / 2
    orbs.forEach(o => { o.x = cx; o.y = cy; o.tx = cx; o.ty = cy })

    // ── Animation loop ───────────────────────────────────────────────────────
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const mx = mouseRef.current.x < 0 ? W / 2 : mouseRef.current.x
      const my = mouseRef.current.y < 0 ? H / 2 : mouseRef.current.y

      // Spotlight
      if (mx > 0) {
        const spotGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 350)
        spotGrad.addColorStop(0, 'rgba(139,92,246,0.08)')
        spotGrad.addColorStop(0.5, 'rgba(99,102,241,0.03)')
        spotGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = spotGrad
        ctx.fillRect(0, 0, W, H)
      }

      // Orbs
      orbs.forEach(o => {
        o.tx = mx + o.offsetX
        o.ty = my + o.offsetY
        o.x += (o.tx - o.x) * o.speed
        o.y += (o.ty - o.y) * o.speed

        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
        grad.addColorStop(0, o.color1)
        grad.addColorStop(1, o.color2)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Particles
      particles.forEach((p, i) => {
        p.x += p.dx
        p.y += p.dy

        // Fade in at birth, fade out near top
        if (p.y > H * 0.8) {
          p.opacity = Math.min(p.opacity + p.dOpacity, 0.7)
        } else {
          p.opacity = Math.max(p.opacity - p.dOpacity * 0.5, 0)
        }

        // Reset when out of view
        if (p.y < -20 || p.opacity <= 0 && p.y < H * 0.5) {
          particles[i] = makeParticle()
          return
        }

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color},1)`
        ctx.shadowBlur = 6
        ctx.shadowColor = `rgba(${p.color},0.8)`
        ctx.fill()
        ctx.restore()
      })

      // Cursor dot glow
      if (mx > 0) {
        const dotGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 28)
        dotGrad.addColorStop(0, 'rgba(139,92,246,0.35)')
        dotGrad.addColorStop(0.5, 'rgba(139,92,246,0.08)')
        dotGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = dotGrad
        ctx.beginPath()
        ctx.arc(mx, my, 28, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
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
