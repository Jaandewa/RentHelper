'use client'

import { useEffect, useRef } from 'react'

/**
 * CursorBackground
 *
 * Full-page canvas that sits fixed behind all content (z-index 0).
 * • Large vivid glowing orbs that spring-follow the cursor
 * • Bright cursor aura (glow ring around pointer)
 * • Floating coloured particles drifting upward
 * • Respects prefers-reduced-motion
 */
export default function CursorBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Respect reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── Helpers ──────────────────────────────────────────────────────────────
    const isDark = () => document.documentElement.classList.contains('dark')

    // ── Resize ───────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Mouse ────────────────────────────────────────────────────────────────
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMove)

    // ── Orbs ─────────────────────────────────────────────────────────────────
    interface Orb {
      x: number; y: number       // current pos (lerped)
      speed: number              // lerp factor
      r: number                  // radius
      offsetX: number            // fixed offset from cursor
      offsetY: number
      // light-mode colours
      c1l: string; c2l: string
      // dark-mode colours
      c1d: string; c2d: string
    }

    const W = () => canvas.width
    const H = () => canvas.height

    const orbs: Orb[] = [
      {
        x: W() / 2, y: H() / 2, speed: 0.04, r: 380,
        offsetX: -60, offsetY: -40,
        c1l: 'rgba(139,92,246,0.45)',  c2l: 'rgba(139,92,246,0)',
        c1d: 'rgba(139,92,246,0.55)',  c2d: 'rgba(139,92,246,0)',
      },
      {
        x: W() / 2, y: H() / 2, speed: 0.026, r: 300,
        offsetX: 120, offsetY: 80,
        c1l: 'rgba(236,72,153,0.38)', c2l: 'rgba(236,72,153,0)',
        c1d: 'rgba(236,72,153,0.50)', c2d: 'rgba(236,72,153,0)',
      },
      {
        x: W() / 2, y: H() / 2, speed: 0.018, r: 450,
        offsetX: 30, offsetY: -180,
        c1l: 'rgba(99,102,241,0.30)',  c2l: 'rgba(99,102,241,0)',
        c1d: 'rgba(99,102,241,0.45)',  c2d: 'rgba(99,102,241,0)',
      },
      {
        x: W() / 2, y: H() / 2, speed: 0.03, r: 260,
        offsetX: -200, offsetY: 120,
        c1l: 'rgba(16,185,129,0.28)',  c2l: 'rgba(16,185,129,0)',
        c1d: 'rgba(16,185,129,0.42)',  c2d: 'rgba(16,185,129,0)',
      },
    ]

    // ── Particles ────────────────────────────────────────────────────────────
    interface Particle {
      x: number; y: number
      r: number
      dx: number; dy: number
      opacity: number
      maxOpacity: number
      fadeDir: 1 | -1
      color: string
    }

    const COLORS_L = ['139,92,246','99,102,241','59,130,246','236,72,153','16,185,129','251,146,60']
    const COLORS_D = ['167,139,250','129,140,248','96,165,250','244,114,182','52,211,153','251,191,36']

    const makeParticle = (): Particle => {
      const dark = isDark()
      const cols = dark ? COLORS_D : COLORS_L
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 80,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.6,
        dy: -(Math.random() * 0.7 + 0.3),
        opacity: 0,
        maxOpacity: Math.random() * 0.6 + 0.3,
        fadeDir: 1,
        color: cols[Math.floor(Math.random() * cols.length)],
      }
    }

    const PARTICLE_COUNT = 80
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const p = makeParticle()
      // spread initial y positions
      p.y = Math.random() * canvas.height
      p.opacity = Math.random() * 0.4
      return p
    })

    // ── Animation loop ───────────────────────────────────────────────────────
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const W = canvas.width, H = canvas.height
      const dark = isDark()

      ctx.clearRect(0, 0, W, H)

      // — Orbs —
      orbs.forEach(o => {
        const tx = mouse.x + o.offsetX
        const ty = mouse.y + o.offsetY
        o.x += (tx - o.x) * o.speed
        o.y += (ty - o.y) * o.speed

        const c1 = dark ? o.c1d : o.c1l
        const c2 = dark ? o.c2d : o.c2l
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
        g.addColorStop(0, c1)
        g.addColorStop(1, c2)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // — Spotlight around cursor —
      const sg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220)
      sg.addColorStop(0,   dark ? 'rgba(167,139,250,0.18)' : 'rgba(139,92,246,0.15)')
      sg.addColorStop(0.4, dark ? 'rgba(99,102,241,0.07)'  : 'rgba(99,102,241,0.06)')
      sg.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = sg
      ctx.fillRect(0, 0, W, H)

      // — Cursor glow ring —
      const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 40)
      cg.addColorStop(0,   dark ? 'rgba(167,139,250,0.70)' : 'rgba(139,92,246,0.60)')
      cg.addColorStop(0.5, dark ? 'rgba(139,92,246,0.20)'  : 'rgba(139,92,246,0.18)')
      cg.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = cg
      ctx.beginPath()
      ctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2)
      ctx.fill()

      // — Particles —
      const cols = dark ? COLORS_D : COLORS_L
      particles.forEach((p, i) => {
        p.x += p.dx
        p.y += p.dy

        // fade in / fade out
        p.opacity += 0.008 * p.fadeDir
        if (p.opacity >= p.maxOpacity) p.fadeDir = -1
        if (p.opacity <= 0 && p.fadeDir === -1) {
          // recycle
          const np = makeParticle()
          np.color = cols[Math.floor(Math.random() * cols.length)]
          particles[i] = np
          return
        }

        // reset when off-screen top
        if (p.y < -20) {
          const np = makeParticle()
          np.color = cols[Math.floor(Math.random() * cols.length)]
          particles[i] = np
          return
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color},1)`
        ctx.shadowBlur = dark ? 12 : 8
        ctx.shadowColor = `rgba(${p.color},0.9)`
        ctx.fill()
        ctx.restore()
      })
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
