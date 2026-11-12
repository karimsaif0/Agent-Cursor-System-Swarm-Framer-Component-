import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

const NAMES = ["Ari", "Bex", "Cal", "Dot", "Eon", "Fox", "Gem", "Hex", "Ivo", "Jet", "Kit", "Lyn", "Max", "Neo", "Oz", "Pip", "Rae", "Sol", "Taz", "Uma"]
const COLORS = ["#ff5c8a", "#34d399", "#38bdf8", "#facc15", "#fb923c", "#a78bfa", "#f43f5e", "#2dd4bf", "#60a5fa", "#e879f9", "#a3e635", "#f472b6", "#22d3ee", "#fbbf24", "#c084fc", "#4ade80", "#fda4af", "#93c5fd", "#fde047", "#86efac"]
const MONO = "'JetBrains Mono', 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

interface Props {
    agents?: number
    speed?: number
    preloader?: boolean
    background?: string
    accent?: string
    chip?: string
    buildLine?: number
    rulers?: boolean
    hud?: boolean
    ringRadius?: number
    replayName?: string
    agentLog?: boolean
    logRows?: number
    style?: React.CSSProperties
}

const DEFAULTS = {
    agents: 14,
    speed: 1,
    preloader: true,
    background: "#0B0D10",
    accent: "#3B82F6",
    chip: "#2563EB",
    buildLine: 0.86,
    rulers: true,
    hud: true,
    ringRadius: 64,
    replayName: "Replay Button",
    agentLog: true,
    logRows: 4,
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
}

function StaticStage({ background, accent, chip, style }: { background: string; accent: string; chip: string; style?: React.CSSProperties }) {
    return (
        <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 360, overflow: "hidden", borderRadius: 14, background, color: "#e8edf7", fontFamily: MONO, ...style }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.16, backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
            <div style={{ position: "relative", zIndex: 1, padding: "clamp(18px,4vw,34px)", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10, letterSpacing: 1.6, color: "#aeb9ca" }}>
                        <span style={{ width: 7, height: 7, borderRadius: 8, background: "#34d399" }} />
                        SWARM BUILD SYSTEM
                    </div>
                    <span style={{ fontSize: 9, color: "#8793a7" }}>STATIC PREVIEW</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(130px,.8fr)", gap: 12, flex: 1, minHeight: 0 }}>
                    <div style={{ border: "1px solid #303b4b", borderRadius: 12, background: "rgba(20,25,34,.92)", padding: "clamp(16px,3vw,28px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
                        <span style={{ color: chip, fontSize: 9, letterSpacing: 1.5 }}>PROJECT / 001</span>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(26px,5vw,54px)", lineHeight: .98, fontWeight: 700, letterSpacing: "-.06em" }}>Build something<br />remarkable<span style={{ color: accent }}>.</span></div>
                        <div style={{ height: 5, borderRadius: 8, background: "#303b4b", overflow: "hidden", maxWidth: 260 }}><div style={{ width: "78%", height: "100%", background: accent }} /></div>
                        <span style={{ color: "#8c98aa", fontSize: 9 }}>MULTI-AGENT SYSTEM · READY</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 12 }}>
                        {[0, 1].map((item) => <div key={item} style={{ border: "1px solid #303b4b", borderRadius: 12, background: "rgba(20,25,34,.92)", padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><span style={{ fontSize: 9, color: "#8c98aa" }}>{item ? "ACTIVE AGENTS" : "LAYERS BUILT"}</span><strong style={{ fontSize: "clamp(22px,3vw,34px)", color: item ? accent : "#e8edf7" }}>{item ? "14" : "24"}</strong><span style={{ height: 3, background: "#303b4b", borderRadius: 5 }}><span style={{ display: "block", width: item ? "84%" : "68%", height: "100%", background: item ? accent : chip }} /></span></div>)}
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 9, color: "#7e8ba0" }}><span>AGENTS READY</span><span>REBUILD EXPERIENCE</span></div>
            </div>
        </div>
    )
}

// Made with 💛 by Karim Saif
export default function SwarmBuild(props: Props) {
    const p = { ...DEFAULTS, ...props }
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number | null>(null)
    const visibleRef = useRef(false)
    const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })
    const pointerRef = useRef({ x: -1000, y: -1000, active: false })
    const startedAtRef = useRef(0)
    const progressRef = useRef(0)
    const rawProgressRef = useRef(0)
    const offscreenAtRef = useRef(0)
    const [visible, setVisible] = useState(false)
    const [progress, setProgress] = useState(0)
    const [runId, setRunId] = useState(0)
    const [complete, setComplete] = useState(false)
    const [paused, setPaused] = useState(false)
    const agentCount = clamp(Math.round(Number(p.agents) || DEFAULTS.agents), 3, 20)
    const speed = clamp(Number(p.speed) || 1, 0.25, 4)
    const accent = p.accent || DEFAULTS.accent
    const chip = p.chip || DEFAULTS.chip
    const background = p.background || DEFAULTS.background
    const duration = 10500 / speed

    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root) return
        let alive = true
        let observer: IntersectionObserver | null = null
        let resizeObserver: ResizeObserver | null = null
        const updateSize = () => {
            if (!alive) return
            const rect = root.getBoundingClientRect()
            const dpr = Math.min(2, Math.max(1, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1))
            sizeRef.current = { width: Math.max(1, rect.width), height: Math.max(1, rect.height), dpr }
            const canvas = canvasRef.current
            if (canvas) {
                canvas.width = Math.round(sizeRef.current.width * dpr)
                canvas.height = Math.round(sizeRef.current.height * dpr)
                canvas.style.width = sizeRef.current.width + "px"
                canvas.style.height = sizeRef.current.height + "px"
            }
        }
        updateSize()
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(updateSize)
            resizeObserver.observe(root)
        }
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver((entries) => {
                const entry = entries[0]
                const next = !!entry?.isIntersecting && entry.intersectionRatio > 0
                if (!next && visibleRef.current) offscreenAtRef.current = performance.now()
                if (next && !visibleRef.current && offscreenAtRef.current) {
                    startedAtRef.current += performance.now() - offscreenAtRef.current
                    offscreenAtRef.current = 0
                }
                visibleRef.current = next
                setVisible(next)
            }, { threshold: [0, 0.01] })
            observer.observe(root)
        } else {
            visibleRef.current = true
            setVisible(true)
        }
        return () => {
            alive = false
            observer?.disconnect()
            resizeObserver?.disconnect()
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic || !visible || complete || paused) {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            return
        }
        if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
            progressRef.current = 1
            rawProgressRef.current = 1
            setProgress(1)
            setComplete(true)
            return
        }
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return
        if (!startedAtRef.current) startedAtRef.current = performance.now() - rawProgressRef.current * duration
        let lastUiUpdate = 0
        const draw = (now: number) => {
            if (!visibleRef.current) {
                rafRef.current = null
                return
            }
            const { width, height, dpr } = sizeRef.current
            if (width < 1 || height < 1) {
                rafRef.current = requestAnimationFrame(draw)
                return
            }
            const elapsed = Math.max(0, now - startedAtRef.current)
            const raw = clamp(elapsed / duration, 0, 1)
            const eased = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2
            progressRef.current = eased
            rawProgressRef.current = raw
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, width, height)
            const lineY = height * clamp(Number(p.buildLine) || DEFAULTS.buildLine, 0.4, 0.98)
            if (p.rulers) {
                ctx.save()
                ctx.strokeStyle = "rgba(146,163,190,.22)"
                ctx.fillStyle = "rgba(160,174,195,.62)"
                ctx.lineWidth = 1
                ctx.font = "9px " + MONO
                for (let x = 22; x < width; x += 32) {
                    ctx.beginPath()
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x, x % 128 === 22 ? 10 : 5)
                    ctx.stroke()
                }
                for (let y = 22; y < height; y += 32) {
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    ctx.lineTo(y % 128 === 22 ? 10 : 5, y)
                    ctx.stroke()
                }
                ctx.restore()
            }
            const count = agentCount
            const radius = clamp(Number(p.ringRadius) || DEFAULTS.ringRadius, 30, 160)
            const travel = Math.max(0, width - 100)
            const buildX = 42 + travel * eased
            const buildY = 70 + (height - 140) * eased
            for (let i = 0; i < count; i++) {
                const phase = now * 0.00045 * (0.7 + (i % 5) * 0.08) + i * Math.PI * 2 / count
                const orbit = radius * (0.48 + (i % 4) * 0.12)
                const tx = pointerRef.current.active ? pointerRef.current.x : buildX
                const ty = pointerRef.current.active ? pointerRef.current.y : buildY
                const x = tx + Math.cos(phase) * orbit
                const y = ty + Math.sin(phase * 1.13) * orbit * 0.58
                const color = COLORS[i % COLORS.length]
                ctx.save()
                ctx.globalAlpha = 0.18
                ctx.strokeStyle = color
                ctx.lineWidth = 1.2
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(tx, ty)
                ctx.stroke()
                ctx.globalAlpha = 1
                ctx.fillStyle = color
                ctx.shadowColor = color
                ctx.shadowBlur = 10
                ctx.beginPath()
                ctx.arc(x, y, 3.2, 0, Math.PI * 2)
                ctx.fill()
                ctx.shadowBlur = 0
                ctx.translate(x + 6, y - 7)
                ctx.fillStyle = "#0b0d10"
                roundedRect(ctx, 0, 0, 29, 15, 4)
                ctx.fill()
                ctx.strokeStyle = color
                ctx.lineWidth = 0.8
                ctx.stroke()
                ctx.fillStyle = "#e9eef7"
                ctx.font = "8px " + MONO
                ctx.fillText(NAMES[i % NAMES.length], 5, 10.5)
                ctx.restore()
            }
            if (raw < 1) {
                ctx.save()
                ctx.strokeStyle = accent
                ctx.globalAlpha = 0.72
                ctx.shadowColor = accent
                ctx.shadowBlur = 10
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(0, lineY)
                ctx.lineTo(width, lineY)
                ctx.stroke()
                ctx.restore()
            }
            if (now - lastUiUpdate > 110 || raw >= 1) {
                lastUiUpdate = now
                setProgress(eased)
            }
            if (raw >= 1) {
                setComplete(true)
                rafRef.current = null
                return
            }
            rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [isStatic, visible, complete, paused, runId, duration, agentCount, accent, p.buildLine, p.rulers, p.ringRadius])

    const restart = () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        progressRef.current = 0
        rawProgressRef.current = 0
        startedAtRef.current = performance.now()
        setProgress(0)
        setComplete(false)
        setPaused(false)
        setRunId((value) => value + 1)
    }

    const skip = () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        progressRef.current = 1
        rawProgressRef.current = 1
        setProgress(1)
        setComplete(true)
        setPaused(false)
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true }
    }

    const handlePointerLeave = () => {
        pointerRef.current.active = false
    }

    if (isStatic) {
        return <StaticStage background={background} accent={accent} chip={chip} style={props.style} />
    }

    const entries = [
        "Mapped component boundaries",
        "Measured layout geometry",
        "Prepared interface layers",
        "Revealed visual hierarchy",
        "Verified responsive structure",
        "Completed final assembly",
        "Synchronized agent positions",
        "Resolved layer dependencies",
    ]
    const completedRows = Math.min(entries.length, Math.floor(progress * entries.length) + (complete ? 1 : 0))
    const showPreloader = !!p.preloader && progress < 0.12 && !complete

    return (
        <div ref={rootRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} style={{ position: "relative", width: "100%", height: "100%", minHeight: 360, overflow: "hidden", isolation: "isolate", borderRadius: 14, background, color: "#e8edf7", fontFamily: MONO, ...props.style }}>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.16, backgroundImage: "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
            <div style={{ position: "absolute", inset: 0, padding: "clamp(14px,3vw,30px)", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10, letterSpacing: 1.5, color: "#aeb9ca" }}><span style={{ width: 7, height: 7, borderRadius: 8, background: complete ? "#34d399" : accent, boxShadow: "0 0 12px " + (complete ? "#34d399" : accent) }} />SWARM BUILD SYSTEM</div>
                    <div style={{ fontSize: 9, color: "#8290a5" }}>{complete ? "BUILD COMPLETE" : visible ? "SYSTEM ACTIVE" : "STANDBY · OFFSCREEN"}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(110px,.8fr)", gap: 12, flex: 1, minHeight: 0 }}>
                    <div style={{ position: "relative", overflow: "hidden", border: "1px solid #303b4b", borderRadius: 12, background: "rgba(20,25,34,.82)", padding: "clamp(14px,3vw,26px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 13 }}>
                        <span style={{ color: chip, fontSize: 9, letterSpacing: 1.5 }}>PROJECT / 001</span>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(25px,5vw,52px)", lineHeight: .98, fontWeight: 700, letterSpacing: "-.06em", opacity: clamp(progress * 1.35, .2, 1), transform: "translateY(" + ((1 - progress) * 12) + "px)" }}>Build something<br />remarkable<span style={{ color: accent }}>.</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8c98aa", fontSize: 9 }}><span style={{ width: 6, height: 6, borderRadius: 8, background: accent }} />{complete ? "ALL SYSTEMS OPERATIONAL" : "ASSEMBLING INTERFACE"}</div>
                        <div style={{ height: 4, borderRadius: 8, background: "#303b4b", overflow: "hidden", maxWidth: 260 }}><div style={{ width: progress * 100 + "%", height: "100%", background: accent, transition: "width .12s linear" }} /></div>
                        <div style={{ position: "absolute", left: 0, right: 0, top: (progress * 100) + "%", height: 1, background: accent, opacity: progress < 1 ? .7 : 0, boxShadow: "0 0 14px " + accent }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 12 }}>
                        {[0, 1].map((item) => <div key={item} style={{ border: "1px solid #303b4b", borderRadius: 12, background: "rgba(20,25,34,.82)", padding: 13, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0 }}><span style={{ fontSize: 9, color: "#8c98aa" }}>{item ? "ACTIVE AGENTS" : "LAYERS BUILT"}</span><strong style={{ fontSize: "clamp(21px,3vw,34px)", color: item ? accent : "#e8edf7" }}>{item ? agentCount : Math.floor(progress * 24)}</strong><span style={{ height: 3, background: "#303b4b", borderRadius: 5, overflow: "hidden" }}><span style={{ display: "block", width: (item ? 84 : progress * 100) + "%", height: "100%", background: item ? accent : chip }} /></span></div>)}
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 9, color: "#7e8ba0" }}><span>{visible ? "VISIBLE · ANIMATION ENABLED" : "OFFSCREEN · ANIMATION PAUSED"}</span><span>{Math.round(progress * 100)}% COMPLETE</span></div>
            </div>
            <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }} />
            {p.agentLog && <div role="region" aria-label="Agent activity log" style={{ position: "absolute", zIndex: 5, top: 54, right: 14, width: "min(245px,44%)", maxHeight: "42%", overflow: "hidden", boxSizing: "border-box", padding: 10, border: "1px solid #303b4b", borderRadius: 10, background: "rgba(12,15,21,.88)", backdropFilter: "blur(10px)", pointerEvents: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6, paddingBottom: 8, borderBottom: "1px solid #303b4b", color: "#aeb9ca", fontSize: 8, letterSpacing: 1 }}>AGENT ACTIVITY <span style={{ color: "#e8edf7" }}>{completedRows} / {entries.length}</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 8 }}>
                    {entries.slice(0, Math.max(1, Math.min(8, Number(p.logRows) || 4))).map((entry, index) => <div key={entry} style={{ display: "flex", alignItems: "center", gap: 6, opacity: index < completedRows ? 1 : .32, fontSize: 8, color: "#c4ccda" }}><span style={{ width: 5, height: 5, flexShrink: 0, borderRadius: 8, background: COLORS[index % COLORS.length] }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry}</span></div>)}
                </div>
            </div>}
            {p.hud && <div style={{ position: "absolute", zIndex: 6, left: "50%", bottom: 14, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 9, maxWidth: "calc(100% - 24px)", padding: "7px 8px 7px 11px", boxSizing: "border-box", border: "1px solid #303b4b", borderRadius: 10, background: "rgba(12,15,21,.94)", color: "#c4ccda", boxShadow: "0 8px 24px rgba(0,0,0,.28)" }}>
                <span style={{ fontSize: 9, whiteSpace: "nowrap" }}>{complete ? "BUILD COMPLETE" : agentCount + " AGENTS"}</span>
                <span style={{ width: 54, height: 3, flexShrink: 0, borderRadius: 4, background: "#303b4b", overflow: "hidden" }}><span style={{ display: "block", width: progress * 100 + "%", height: "100%", background: accent }} /></span>
                <button type="button" aria-label={complete ? (p.replayName || "Rebuild component stage") : "Skip build animation"} onClick={complete ? restart : skip} style={{ border: 0, borderRadius: 6, padding: "7px 10px", background: accent, color: "#fff", font: "700 9px " + MONO, cursor: "pointer" }}>{complete ? "REBUILD" : "SKIP"}</button>
                <button type="button" aria-label={paused ? "Resume animation" : "Pause animation"} onClick={() => { if (paused) { startedAtRef.current = performance.now() - rawProgressRef.current * duration; setPaused(false) } else { setPaused(true) } }} style={{ border: "1px solid #3b4658", borderRadius: 6, padding: "7px 9px", background: "transparent", color: "#c4ccda", font: "700 9px " + MONO, cursor: "pointer" }}>{paused ? "PLAY" : "PAUSE"}</button>
            </div>}
            {showPreloader && <div aria-live="polite" style={{ position: "absolute", zIndex: 10, inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(8,10,14,.93)", color: "#e8edf7", pointerEvents: "none" }}>
                <div style={{ width: 42, height: 42, border: "1px solid #354155", borderRadius: 12, display: "grid", placeItems: "center", boxShadow: "0 0 28px rgba(59,130,246,.12)" }}><span style={{ width: 18, height: 18, border: "2px dashed " + accent, borderRadius: 5, transform: "rotate(25deg)" }} /></div>
                <span style={{ fontSize: 9, letterSpacing: 1.6 }}>INITIALIZING AGENT SWARM</span>
                <span style={{ color: "#7f8ba0", fontSize: 9 }}>{Math.round(progress * 100)}% · PREPARING BUILD</span>
            </div>}
        </div>
    )
}

addPropertyControls(SwarmBuild, {
    agents: { type: ControlType.Number, title: "Agents", description: "Number of animated cursor agents shown inside this component stage.", min: 3, max: 20, step: 1, defaultValue: 14 },
    speed: { type: ControlType.Enum, title: "Speed", description: "Animation speed for the self-contained agent build sequence.", options: [1, 2, 4], optionTitles: ["1×", "2×", "4×"], defaultValue: 1 },
    preloader: { type: ControlType.Boolean, title: "Preloader", description: "Show the initialization screen inside the component before the build sequence progresses.", defaultValue: true },
    background: { type: ControlType.Color, title: "Preloader BG", description: "Background color for the component's own stage and static fallback.", defaultValue: "#0B0D10" },
    accent: { type: ControlType.Color, title: "Accent", description: "Accent color for agent indicators, progress, and action controls.", defaultValue: "#3B82F6" },
    chip: { type: ControlType.Color, title: "Size Chip", description: "Color used for project labels and secondary progress indicators.", defaultValue: "#2563EB" },
    buildLine: { type: ControlType.Number, title: "Build Line", description: "Vertical position ratio of the scanning guide within the component stage.", min: 0.4, max: 0.98, step: 0.01, defaultValue: 0.86 },
    rulers: { type: ControlType.Boolean, title: "Rulers", description: "Show technical measurement ticks drawn only inside the component canvas.", defaultValue: true },
    hud: { type: ControlType.Boolean, title: "HUD", description: "Show the component-local progress bar and animation controls.", defaultValue: true },
    ringRadius: { type: ControlType.Number, title: "Ring Radius", description: "Adjust the orbit radius of agents around their current build focus.", min: 30, max: 160, step: 1, defaultValue: 64 },
    replayName: { type: ControlType.String, title: "Replay Label", description: "Accessible label used for the component's rebuild action.", defaultValue: "Replay Button" },
    agentLog: { type: ControlType.Boolean, title: "Agent Log", description: "Show the component-local agent activity panel.", defaultValue: true },
    logRows: { type: ControlType.Number, title: "Log Rows", description: "Maximum number of activity entries visible in the agent log.", min: 1, max: 8, step: 1, defaultValue: 4 },
})
