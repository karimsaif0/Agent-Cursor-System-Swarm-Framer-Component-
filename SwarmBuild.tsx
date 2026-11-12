import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

interface Props {
    agents: number
    speed: number
    accent: string
    background: string
    panel: string
    showLog: boolean
    showHud: boolean
    showRulers: boolean
    ringRadius: number
    density: number
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    agents: 8,
    speed: 1,
    accent: "#55A7FF",
    background: "#0B0E14",
    panel: "#141A24",
    showLog: true,
    showHud: true,
    showRulers: true,
    ringRadius: 58,
    density: 6,
}

const NAMES = ["ARI", "BEX", "CAL", "DOT", "EON", "FOX", "GEM", "HEX", "IVO", "JET", "KIT", "LYN"]
const COLORS = ["#FF6B8A", "#48D6A5", "#55B8FF", "#FFD166", "#B69CFF", "#FF9F68", "#6DE0D2", "#F28BD5", "#9BB7FF", "#C4E879", "#FFA5B8", "#8DE1FF"]

type Agent = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; color: string; name: string; phase: number; target: number }
type Task = { x: number; y: number; w: number; h: number; label: string; progress: number; done: boolean }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// Made with 💛 by Karim Saif
export default function AgentCursorSwarm(props: Partial<Props>) {
    const p = { ...DEFAULTS, ...props }
    const staticRenderer = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const frameRef = useRef<number>(0)
    const visibleRef = useRef(false)
    const pointerRef = useRef({ x: -1000, y: -1000, active: false })
    const [progress, setProgress] = useState(0)
    const [active, setActive] = useState(false)
    const taskLabels = ["Mapping component bounds", "Preparing visual layers", "Synchronizing agents"]

    useEffect(() => {
        if (staticRenderer) return
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return
        const context = canvas.getContext("2d", { alpha: true })
        if (!context) return

        let width = 1
        let height = 1
        let dpr = 1
        let disposed = false
        let last = 0
        let elapsed = 0
        let lastProgress = -1
        let tasks: Task[] = []
        let agents: Agent[] = []

        const makeScene = () => {
            const count = clamp(Math.round(p.density), 3, 8)
            const gap = Math.max(12, Math.min(22, width * 0.025))
            const cardW = Math.min(220, Math.max(90, (width - gap * (count > 5 ? 3 : 2)) / (count > 5 ? 3 : 2)))
            const cardH = Math.max(54, Math.min(104, height * 0.16))
            const left = Math.max(18, (width - (cardW * 2 + gap)) / 2)
            const top = Math.max(66, height * 0.25)
            tasks = Array.from({ length: count }, (_, i) => {
                const col = i % 2
                const row = Math.floor(i / 2)
                return { x: left + col * (cardW + gap), y: top + row * (cardH + gap), w: cardW, h: cardH, label: ["Hero composition", "Navigation system", "Content structure", "Visual hierarchy", "Responsive layout", "Interaction layer", "Typography pass", "Final alignment"][i], progress: 0, done: false }
            })
            agents = Array.from({ length: clamp(Math.round(p.agents), 1, 16) }, (_, i) => ({
                x: width * 0.5,
                y: height * 0.5,
                tx: width * 0.5 + Math.cos(i * 6.28 / Math.max(1, p.agents)) * p.ringRadius,
                ty: height * 0.5 + Math.sin(i * 6.28 / Math.max(1, p.agents)) * p.ringRadius,
                vx: 0,
                vy: 0,
                color: COLORS[i % COLORS.length],
                name: NAMES[i % NAMES.length],
                phase: i * 0.71,
                target: i % Math.max(1, count),
            }))
        }

        const resize = () => {
            const rect = root.getBoundingClientRect()
            width = Math.max(1, rect.width)
            height = Math.max(1, rect.height)
            dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.round(width * dpr)
            canvas.height = Math.round(height * dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            context.setTransform(dpr, 0, 0, dpr, 0, 0)
            makeScene()
            draw(0)
        }

        const rounded = (x: number, y: number, w: number, h: number, r: number) => {
            context.beginPath()
            context.roundRect(x, y, w, h, r)
        }

        const draw = (dt: number) => {
            context.clearRect(0, 0, width, height)
            const accent = p.accent || DEFAULTS.accent
            const elapsedNow = elapsed
            const cycle = (elapsedNow * 0.000055 * clamp(p.speed, 0.25, 4)) % 1
            const completed = Math.floor(cycle * tasks.length)
            const local = (cycle * tasks.length) % 1
            tasks.forEach((task, i) => {
                const done = i < completed
                const reveal = done ? 1 : i === completed ? local : 0
                const y = task.y
                context.save()
                rounded(task.x, y, task.w, task.h, 9)
                context.fillStyle = "rgba(20,26,36,0.92)"
                context.fill()
                context.strokeStyle = done ? "rgba(85,167,255,0.55)" : "rgba(130,148,174,0.16)"
                context.lineWidth = 1
                context.stroke()
                context.fillStyle = "rgba(226,234,246,0.78)"
                context.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace"
                context.fillText(task.label.toUpperCase(), task.x + 12, y + 18)
                context.fillStyle = "rgba(129,145,168,0.18)"
                rounded(task.x + 12, y + 29, task.w - 24, 5, 3)
                context.fill()
                context.fillStyle = accent
                rounded(task.x + 12, y + 29, (task.w - 24) * reveal, 5, 3)
                context.fill()
                const lines = 2 + (i % 3)
                for (let j = 0; j < lines; j++) {
                    context.fillStyle = `rgba(178,192,213,${0.09 + reveal * 0.22})`
                    rounded(task.x + 12, y + 44 + j * 8, (task.w - 24) * (0.45 + ((j + i) % 3) * 0.13), 3, 2)
                    context.fill()
                }
                if (reveal > 0.02 && reveal < 1) {
                    const scanX = task.x + 12 + (task.w - 24) * reveal
                    context.fillStyle = accent
                    context.shadowColor = accent
                    context.shadowBlur = 12
                    context.fillRect(scanX, y + 25, 1.5, task.h - 34)
                    context.shadowBlur = 0
                }
                context.restore()
            })

            const cx = pointerRef.current.active ? pointerRef.current.x : width * 0.5
            const cy = pointerRef.current.active ? pointerRef.current.y : height * 0.47
            agents.forEach((agent, i) => {
                const target = tasks[agent.target % Math.max(1, tasks.length)]
                const phase = elapsedNow * 0.001 * clamp(p.speed, 0.25, 4) + agent.phase
                const orbitX = target ? target.x + target.w * (0.2 + (i % 3) * 0.3) : cx
                const orbitY = target ? target.y + target.h * (0.48 + Math.sin(phase) * 0.18) : cy
                agent.tx = pointerRef.current.active ? cx + Math.cos(phase) * p.ringRadius : orbitX + Math.cos(phase) * 18
                agent.ty = pointerRef.current.active ? cy + Math.sin(phase) * p.ringRadius : orbitY + Math.sin(phase) * 13
                agent.vx += (agent.tx - agent.x) * 0.018
                agent.vy += (agent.ty - agent.y) * 0.018
                agent.vx *= 0.84
                agent.vy *= 0.84
                agent.x += agent.vx
                agent.y += agent.vy
                context.save()
                context.strokeStyle = agent.color
                context.globalAlpha = 0.35
                context.lineWidth = 1
                context.beginPath()
                context.moveTo(agent.x, agent.y)
                context.lineTo(agent.x - agent.vx * 2.8, agent.y - agent.vy * 2.8)
                context.stroke()
                context.globalAlpha = 1
                context.translate(agent.x, agent.y)
                context.rotate(Math.atan2(agent.vy, agent.vx) + Math.PI / 2)
                context.fillStyle = agent.color
                context.shadowColor = agent.color
                context.shadowBlur = 8
                context.beginPath()
                context.moveTo(0, -9)
                context.lineTo(-5.5, 6)
                context.lineTo(0, 3)
                context.lineTo(5.5, 6)
                context.closePath()
                context.fill()
                context.shadowBlur = 0
                context.rotate(-Math.atan2(agent.vy, agent.vx) - Math.PI / 2)
                context.fillStyle = "rgba(8,12,18,0.94)"
                context.font = "700 7px ui-monospace, monospace"
                context.textAlign = "left"
                context.fillText(agent.name, 9, -8)
                context.restore()
            })

            if (p.showRulers) {
                context.save()
                context.strokeStyle = "rgba(130,153,183,0.12)"
                context.fillStyle = "rgba(155,174,200,0.42)"
                context.font = "8px ui-monospace, monospace"
                context.lineWidth = 1
                for (let x = 18; x < width; x += 32) {
                    context.beginPath()
                    context.moveTo(x, 0)
                    context.lineTo(x, x % 128 === 18 ? 10 : 5)
                    context.stroke()
                }
                for (let y = 18; y < height; y += 32) {
                    context.beginPath()
                    context.moveTo(0, y)
                    context.lineTo(y % 128 === 18 ? 10 : 5, y)
                    context.stroke()
                }
                context.restore()
            }

            if (pointerRef.current.active) {
                context.save()
                context.strokeStyle = accent
                context.globalAlpha = 0.5
                context.lineWidth = 1
                context.beginPath()
                context.arc(cx, cy, p.ringRadius, 0, Math.PI * 2)
                context.stroke()
                context.beginPath()
                context.moveTo(cx - 9, cy)
                context.lineTo(cx + 9, cy)
                context.moveTo(cx, cy - 9)
                context.lineTo(cx, cy + 9)
                context.stroke()
                context.restore()
            }
        }

        const tick = (time: number) => {
            if (disposed || !visibleRef.current) return
            const dt = last ? Math.min(40, time - last) : 16
            last = time
            elapsed += dt
            draw(dt)
            const nextProgress = Math.floor(((elapsed * 0.000055 * clamp(p.speed, 0.25, 4)) % 1) * 100)
            if (nextProgress !== lastProgress) {
                lastProgress = nextProgress
                setProgress(nextProgress)
            }
            frameRef.current = requestAnimationFrame(tick)
        }

        const start = () => {
            if (disposed || !visibleRef.current || frameRef.current) return
            last = 0
            setActive(true)
            frameRef.current = requestAnimationFrame(tick)
        }
        const stop = () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
            frameRef.current = 0
            setActive(false)
        }

        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
        resizeObserver?.observe(root)
        resize()

        const intersectionObserver = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => {
            const entry = entries[0]
            visibleRef.current = !!entry?.isIntersecting && entry.intersectionRatio > 0
            if (visibleRef.current) start()
            else stop()
        }, { threshold: 0.01 }) : null
        if (intersectionObserver) intersectionObserver.observe(root)
        else {
            visibleRef.current = true
            start()
        }

        const onPointerMove = (event: PointerEvent) => {
            const rect = root.getBoundingClientRect()
            pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true }
            if (visibleRef.current) start()
        }
        const onPointerLeave = () => { pointerRef.current.active = false }
        root.addEventListener("pointermove", onPointerMove, { passive: true })
        root.addEventListener("pointerleave", onPointerLeave, { passive: true })

        return () => {
            disposed = true
            stop()
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerleave", onPointerLeave)
        }
    }, [staticRenderer, p.agents, p.speed, p.accent, p.ringRadius, p.density, p.showRulers])

    const staticCards = Array.from({ length: clamp(Math.round(p.density), 3, 8) }, (_, i) => ["Hero composition", "Navigation system", "Content structure", "Visual hierarchy", "Responsive layout", "Interaction layer", "Typography pass", "Final alignment"][i])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 280,
                overflow: "hidden",
                isolation: "isolate",
                borderRadius: 14,
                background: p.background,
                color: "#E8EEF8",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                ...props.style,
            }}
        >
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 42%, rgba(54,91,143,0.16), transparent 65%)", pointerEvents: "none" }} />
            {staticRenderer ? (
                <div style={{ position: "absolute", inset: 0, padding: "18% 8% 8%", display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, alignContent: "center" }}>
                    {staticCards.map((label, i) => (
                        <div key={label} style={{ minHeight: 58, border: "1px solid rgba(140,165,198,0.2)", borderRadius: 9, background: p.panel, padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 9, letterSpacing: 1, color: "#C8D3E4" }}>{label.toUpperCase()}</span>
                            <span style={{ display: "block", height: 4, width: `${42 + (i % 4) * 12}%`, borderRadius: 4, background: p.accent, opacity: 0.8 }} />
                        </div>
                    ))}
                </div>
            ) : (
                <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, display: "block", pointerEvents: "none" }} />
            )}
            <div style={{ position: "absolute", top: 18, left: 20, right: 20, display: "flex", alignItems: "center", justifyContent: "space-between", pointerEvents: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 10, background: p.accent, boxShadow: `0 0 12px ${p.accent}` }} />
                    <span style={{ fontSize: 10, letterSpacing: 1.8, fontWeight: 700 }}>SWARM / BUILD SYSTEM</span>
                </div>
                <span style={{ color: "#8493A9", fontSize: 9, fontFamily: "ui-monospace, monospace" }}>{staticRenderer ? "STATIC PREVIEW" : active ? "SYSTEM ACTIVE" : "SYSTEM IDLE"}</span>
            </div>
            {p.showHud && <div style={{ position: "absolute", left: 20, bottom: 18, display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid rgba(140,165,198,0.2)", borderRadius: 8, background: "rgba(12,17,25,0.86)", backdropFilter: "blur(10px)", pointerEvents: "none" }}>
                <span style={{ fontSize: 9, color: "#93A3B9", fontFamily: "ui-monospace, monospace" }}>{clamp(Math.round(p.agents), 1, 16)} AGENTS</span>
                <span style={{ width: 72, height: 3, borderRadius: 4, background: "rgba(145,165,193,0.18)", overflow: "hidden" }}><span style={{ display: "block", width: `${staticRenderer ? 64 : progress}%`, height: "100%", background: p.accent }} /></span>
                <span style={{ fontSize: 9, color: "#D7E2F2", fontFamily: "ui-monospace, monospace" }}>{staticRenderer ? "READY" : `${progress}%`}</span>
            </div>}
            {p.showLog && <div style={{ position: "absolute", right: 18, bottom: 18, width: "min(220px, 42%)", padding: 11, border: "1px solid rgba(140,165,198,0.2)", borderRadius: 9, background: "rgba(16,22,32,0.9)", backdropFilter: "blur(12px)", pointerEvents: "none" }}>
                <div style={{ fontSize: 8, letterSpacing: 1.4, color: "#91A0B5", marginBottom: 8 }}>AGENT ACTIVITY</div>
                {taskLabels.slice(0, 3).map((label, i) => <div key={label} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, fontSize: 8, color: i === 0 ? "#E4ECF8" : "#8190A6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span style={{ width: 5, height: 5, borderRadius: 5, background: COLORS[i], flexShrink: 0 }} />{label}</div>)}
            </div>}
            <div style={{ position: "absolute", top: 44, left: 20, fontSize: 8, letterSpacing: 1.2, color: "rgba(143,160,184,0.55)", pointerEvents: "none" }}>LOCAL CANVAS · ISOLATED RENDER · {staticRenderer ? "NO MOTION" : "VIEWPORT AWARE"}</div>
        </div>
    )
}

addPropertyControls(AgentCursorSwarm, {
    agents: { type: ControlType.Number, title: "Agents", description: "Number of animated cursor agents inside this component only.", min: 1, max: 16, step: 1, defaultValue: 8 },
    speed: { type: ControlType.Number, title: "Speed", description: "Controls how quickly the local build sequence progresses.", min: 0.25, max: 4, step: 0.25, defaultValue: 1 },
    accent: { type: ControlType.Color, title: "Accent", description: "Color used for agent cursors, scan progress, and active details.", defaultValue: "#55A7FF" },
    background: { type: ControlType.Color, title: "Background", description: "Background color of the isolated swarm stage.", defaultValue: "#0B0E14" },
    panel: { type: ControlType.Color, title: "Panel", description: "Background color used by the static preview cards.", defaultValue: "#141A24" },
    showLog: { type: ControlType.Boolean, title: "Agent Log", description: "Show or hide the activity panel inside the component frame.", defaultValue: true },
    showHud: { type: ControlType.Boolean, title: "HUD", description: "Show or hide the local progress and agent-count display.", defaultValue: true },
    showRulers: { type: ControlType.Boolean, title: "Rulers", description: "Show or hide measurement ticks drawn inside the component canvas.", defaultValue: true },
    ringRadius: { type: ControlType.Number, title: "Ring Radius", description: "Sets the cursor agents' orbit radius around the local pointer position.", min: 20, max: 140, step: 1, defaultValue: 58 },
    density: { type: ControlType.Number, title: "Build Layers", description: "Number of visual build cards rendered inside the component.", min: 3, max: 8, step: 1, defaultValue: 6 },
})