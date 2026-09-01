"use client"

import { useEffect, useRef, useCallback } from "react"

const DEFAULT_PARTICLE_COLORS = ["#94a3b8", "#64748b", "#475569"]

interface ParticlesProps {
  particleCount?: number
  particleSpread?: number
  speed?: number
  particleColors?: string[]
  moveParticlesOnHover?: boolean
  particleHoverFactor?: number
  alphaParticles?: boolean
  particleBaseSize?: number
  sizeRandomness?: number
  cameraDistance?: number
  disableRotation?: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  rotation: number
  rotationSpeed: number
  depth: number
}

export default function Particles({
  particleCount = 580,
  particleSpread = 7,
  speed = 0.33,
  particleColors = DEFAULT_PARTICLE_COLORS,
  moveParticlesOnHover = false,
  particleHoverFactor = 1,
  alphaParticles = false,
  particleBaseSize = 100,
  sizeRandomness = 1,
  cameraDistance = 20,
  disableRotation = false,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const animFrameRef = useRef<number>(0)

  const createParticle = useCallback(
    (canvas: HTMLCanvasElement): Particle => {
      const spread = particleSpread
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * spread
      return {
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 0.5) * speed * 2,
        size:
          (particleBaseSize / cameraDistance) *
          (1 + Math.random() * sizeRandomness),
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        alpha: alphaParticles ? 0.3 + Math.random() * 0.7 : 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: disableRotation
          ? 0
          : (Math.random() - 0.5) * 0.02,
        depth: Math.random() * cameraDistance,
      }
    },
    [
      particleSpread,
      speed,
      particleBaseSize,
      cameraDistance,
      sizeRandomness,
      particleColors,
      alphaParticles,
      disableRotation,
    ]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    resize()

    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(canvas)
    )

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)
    window.addEventListener("resize", resize)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particlesRef.current) {
        if (moveParticlesOnHover && mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x
          const dy = mouseRef.current.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0 && dist < 200) {
            const force = ((200 - dist) / 200) * particleHoverFactor * 0.5
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.vy *= 0.99
        p.rotation += p.rotationSpeed

        if (p.x < -50) p.x = canvas.width + 50
        if (p.x > canvas.width + 50) p.x = -50
        if (p.y < -50) p.y = canvas.height + 50
        if (p.y > canvas.height + 50) p.y = -50

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      window.removeEventListener("resize", resize)
    }
  }, [
    particleCount,
    createParticle,
    moveParticlesOnHover,
    particleHoverFactor,
  ])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ display: "block" }}
    />
  )
}
