import * as React from "react"
import { createPortal } from "react-dom"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

const NAMES = [
    "Ari",
    "Bex",
    "Cal",
    "Dot",
    "Eon",
    "Fox",
    "Gem",
    "Hex",
    "Ivo",
    "Jet",
    "Kit",
    "Lyn",
    "Max",
    "Neo",
    "Oz",
    "Pip",
    "Rae",
    "Sol",
    "Taz",
    "Uma",
]
const COLORS = [
    "#ff5c8a",
    "#34d399",
    "#38bdf8",
    "#facc15",
    "#fb923c",
    "#a78bfa",
    "#f43f5e",
    "#2dd4bf",
    "#60a5fa",
    "#e879f9",
    "#a3e635",
    "#f472b6",
    "#22d3ee",
    "#fbbf24",
    "#c084fc",
    "#4ade80",
    "#fda4af",
    "#93c5fd",
    "#fde047",
    "#86efac",
]
const MONO =
    "'JetBrains Mono', 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const ARROW_DIR = Math.atan2(-10, -5)
const TEXT_SEL = '[data-framer-component-type="RichTextContainer"]'
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
}

type Kind = "text" | "leaf" | "frame"
interface Line {
    top: number
    bottom: number
    left: number
    right: number
}
interface Job {
    el: HTMLElement
    kind: Kind
    originalAttribute: string | null
    originalStyles: Record<string, { value: string; priority: string }>
    backgroundWrapper: HTMLElement | null
    originalWrapperOpacity: { value: string; priority: string } | null
    parent: Job | null
    state: number
    chars: number
    lines: Line[]
}
interface Box {
    job: Job
    p: number
    doneAt: number
}
interface Agent {
    x: number
    y: number
    vx: number
    vy: number
    ang: number
    want: number
    tx: number
    ty: number
    k: number
    color: string
    name: string
    job: Job | null
    box: Box | null
    phase: string
    t0: number
    tag: number
    beam: boolean
    cx: number
    cy: number
    ch: number
}
interface Hud {
    phase: string
    built: number
    total: number
    scan: number
    speed: number
    time: number
    hidden: boolean
}
interface LogEntry {
    id: number
    agent: string
    color: string
    action: string
    time: number
}

function col(c: string, fallback: string): string {
    if (!c) return fallback
    if (c.indexOf("var(") === 0 && c.indexOf(",") > 0)
        return c.slice(c.indexOf(",") + 1, c.lastIndexOf(")")).trim()
    return c
}

function rr(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const q = Math.min(r, h / 2, w / 2)
    ctx.beginPath()
    ctx.moveTo(x + q, y)
    ctx.arcTo(x + w, y, x + w, y + h, q)
    ctx.arcTo(x + w, y + h, x, y + h, q)
    ctx.arcTo(x, y + h, x, y, q)
    ctx.arcTo(x, y, x + w, y, q)
    ctx.closePath()
}

// Made with 💛 by Karim Saif
export default function SwarmBuild(props: Props) {
    const p = { ...DEFAULTS, ...props }
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const api = useRef<any>({})
    const propsRef = useRef(p)
    propsRef.current = p
    const agentCount = Math.max(1, Math.min(20, Math.round(p.agents)))
    const [overlay, setOverlay] = useState<boolean>(!!p.preloader)
    const [hud, setHud] = useState<Hud>({
        phase: p.preloader ? "scan" : "build",
        built: 0,
        total: 0,
        scan: 0,
        speed: p.speed,
        time: 0,
        hidden: false,
    })
    const [vw, setVw] = useState<number>(1440)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const logId = useRef(0)
    useEffect(() => {
        if (typeof window === "undefined") return
        const on = () => setVw(window.innerWidth)
        on()
        window.addEventListener("resize", on)
        return () => window.removeEventListener("resize", on)
    }, [])
    const mobile = vw < 810
    const tiny = vw < 430

    useEffect(() => {
        if (isCanvas) return
        const self = rootRef.current
        const canvas = canvasRef.current
        if (!self || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const motionQuery = window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null
        let reducedMotion = !!motionQuery?.matches
        let vw = window.innerWidth
        let vh = window.innerHeight
        let dpr = Math.min(2, window.devicePixelRatio || 1)
        const resize = () => {
            vw = window.innerWidth
            vh = window.innerHeight
            dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.round(vw * dpr)
            canvas.height = Math.round(vh * dpr)
            canvas.style.width = vw + "px"
            canvas.style.height = vh + "px"
        }
        resize()
        window.addEventListener("resize", resize, { passive: true })
        const resizeObserver = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => resize())
            : null
        const observedMain = document.getElementById("main") || document.querySelector("main") || document.documentElement
        resizeObserver?.observe(observedMain)

        const arrow = new Path2D(
            "M0 0 L0 15.5 L4.2 11.6 L7.1 18 L9.6 16.9 L6.8 10.7 L12.4 10.7 Z"
        )
        const n = agentCount
        const agents: Agent[] = []
        for (let i = 0; i < n; i++) {
            agents.push({
                x: vw / 2,
                y: vh / 2,
                vx: 0,
                vy: 0,
                ang: 0,
                want: 0,
                tx: vw / 2,
                ty: vh / 2,
                k: 200,
                color: COLORS[i % COLORS.length],
                name: NAMES[i % NAMES.length],
                job: null,
                box: null,
                phase: "idle",
                t0: 0,
                tag: 0,
                beam: false,
                cx: 0,
                cy: 0,
                ch: 0,
            })
        }

        let jobs: Job[] = []
        let boxes: Box[] = []
        let phase = "scan"
        let phaseStart = performance.now()
        let buildStart = 0
        let buildEnd = 0
        let speed = Math.max(1, Number(propsRef.current.speed) || 1)
        let configuredSpeed = speed
        let mx = -1
        let my = -1
        let ringA = 0
        let touring = false
        let chrome = 0
        let lastBusy = 0
        let hudHidden = false
        let lastPointerAt = performance.now()
        let lastPath = window.location.pathname
        let routeAt = 0
        let routeOld: HTMLElement[] = []
        let routeStable = 0
        let scanMs = 1800

        const restore = (j: Job) => {
            for (const [property, saved] of Object.entries(j.originalStyles)) {
                if (saved.value) j.el.style.setProperty(property, saved.value, saved.priority)
                else j.el.style.removeProperty(property)
            }
            if (j.originalAttribute === null) j.el.removeAttribute("data-swarm")
            else j.el.setAttribute("data-swarm", j.originalAttribute)
            if (j.backgroundWrapper && j.originalWrapperOpacity) {
                const saved = j.originalWrapperOpacity
                if (saved.value) j.backgroundWrapper.style.setProperty("opacity", saved.value, saved.priority)
                else j.backgroundWrapper.style.removeProperty("opacity")
            }
        }
        const snapshotStyle = (el: HTMLElement, properties: string[]) => {
            const result: Record<string, { value: string; priority: string }> = {}
            for (const property of properties) result[property] = {
                value: el.style.getPropertyValue(property),
                priority: el.style.getPropertyPriority(property),
            }
            return result
        }
        const conceal = (j: Job) => {
            if (j.kind === "frame") {
                j.el.style.setProperty("background-color", "transparent", "important")
                j.el.style.setProperty("background-image", "none", "important")
                j.el.style.setProperty("box-shadow", "none", "important")
                j.el.style.setProperty("border-color", "transparent", "important")
                j.el.style.setProperty("outline-color", "transparent", "important")
                if (j.backgroundWrapper) j.backgroundWrapper.style.setProperty("opacity", "0", "important")
            } else {
                j.el.style.setProperty("clip-path", "inset(0 100% 100% 0)", "important")
            }
        }
        const visible = (el: HTMLElement) => {
            const r = el.getBoundingClientRect()
            if (r.width < 2 || r.height < 2) return false
            const cs = getComputedStyle(el)
            return cs.display !== "none" && cs.visibility !== "hidden"
        }
        const collect = (): Job[] => {
            const main = document.getElementById("main") || document.querySelector("main") || document.body
            const excluded = "script,style,noscript,template,[aria-hidden='true'],[data-swarm-ignore='true'],[data-swarm-overlay='true'],[contenteditable='true'],input,textarea,select,option,video,audio,iframe"
            const list = Array.from(
                main.querySelectorAll<HTMLElement>("[data-framer-name], " + TEXT_SEL)
            ).filter((el) => {
                if (el.closest(excluded)) return false
                if (self.contains(el) || el.contains(self)) return false
                if (!el.isConnected) return false
                const style = getComputedStyle(el)
                if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false
                const rect = el.getBoundingClientRect()
                return rect.width >= 2 && rect.height >= 2
            }).slice(0, 300)
            const map = new Map<HTMLElement, Job>()
            const out: Job[] = []
            for (const el of list) {
                const host = el.parentElement
                    ? el.parentElement.closest(TEXT_SEL)
                    : null
                if (host) continue
                if (!visible(el)) continue
                const wrapper = el.querySelector<HTMLElement>(":scope > [data-framer-background-image-wrapper]")
                const job: Job = {
                    el,
                    kind: el.matches(TEXT_SEL) ? "text" : "leaf",
                    originalAttribute: el.getAttribute("data-swarm"),
                    originalStyles: snapshotStyle(el, ["clip-path", "background-color", "background-image", "box-shadow", "border-color", "outline-color"]),
                    backgroundWrapper: wrapper,
                    originalWrapperOpacity: wrapper ? {
                        value: wrapper.style.getPropertyValue("opacity"),
                        priority: wrapper.style.getPropertyPriority("opacity"),
                    } : null,
                    parent: null,
                    state: 0,
                    chars: (el.textContent || "").length,
                    lines: [],
                }
                map.set(el, job)
                out.push(job)
            }
            for (const j of out) {
                let par = j.el.parentElement
                while (par && !map.has(par)) par = par.parentElement
                if (par) {
                    const pj = map.get(par) as Job
                    j.parent = pj
                    if (pj.kind === "leaf") pj.kind = "frame"
                }
            }
            return out
        }
        const start = () => {
            setLogs([])
            logId.current = 0
            jobs.forEach(restore)
            jobs = collect()
            boxes = []
            if (reducedMotion) {
                jobs.forEach((j) => { j.state = 2 })
                agents.forEach((a) => { a.job = null; a.box = null; a.beam = false; a.phase = "idle" })
                phase = "build"
                buildStart = performance.now()
                buildEnd = buildStart
                setOverlay(false)
                setHud((h) => ({ ...h, phase: "done", built: jobs.length, total: jobs.length, scan: jobs.length, hidden: true }))
                return
            }
            jobs.forEach(conceal)
            agents.forEach((a) => {
                a.job = null
                a.box = null
                a.beam = false
                a.phase = "idle"
            })
            buildEnd = 0
            const pre = !!propsRef.current.preloader
            phase = pre ? "scan" : "build"
            phaseStart = performance.now()
            buildStart = pre ? 0 : phaseStart
            if (pre)
                agents.forEach((a) => {
                    a.x = vw / 2
                    a.y = vh / 2
                    a.vx = 0
                    a.vy = 0
                })
            setOverlay(pre)
            hudHidden = false
        }
        const skip = () => {
            jobs.forEach((j) => {
                restore(j)
                j.state = 2
            })
            agents.forEach((a) => {
                a.job = null
                a.box = null
                a.beam = false
            })
            boxes = []
            if (phase === "scan") {
                phase = "build"
                buildStart = performance.now()
            }
            setOverlay(false)
            if (!buildEnd) buildEnd = performance.now()
        }
        const replay = () => {
            start()
        }
        api.current = {
            replay,
            skip: () => {
                skip()
                hudHidden = false
            },
            tour: () => {
                touring = !touring
            },
            cycle: () => {
                speed = speed >= 4 ? 1 : speed * 2
            },
            close: () => {
                skip()
                hudHidden = true
            },
        }

        const onMove = (e: PointerEvent) => {
            mx = e.clientX
            my = e.clientY
            lastPointerAt = performance.now()
            if (!reducedMotion) startLoop()
        }
        const onKey = (e: KeyboardEvent) => {
            touring = false
            const target = e.target as HTMLElement | null
            const editing = !!target && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))
            if (e.key === "Escape" && !editing) skip()
        }
        const stopTour = () => {
            touring = false
        }
        const onClick = (e: MouseEvent) => {
            const anchor =
                e.target instanceof Element ? e.target.closest("a[href]") : null
            if (
                anchor &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.shiftKey &&
                anchor.getAttribute("target") !== "_blank"
            ) {
                try {
                    const url = new URL(
                        (anchor as HTMLAnchorElement).href,
                        window.location.href
                    )
                    if (
                        url.origin === window.location.origin &&
                        url.pathname !== window.location.pathname &&
                        propsRef.current.preloader
                    )
                        setOverlay(true)
                } catch (err) {}
            }
            const name = String(propsRef.current.replayName || "").toLowerCase()
            if (!name) return
            let el: Element | null =
                e.target instanceof Element
                    ? e.target.closest("[data-framer-name]")
                    : null
            while (el) {
                if (
                    (
                        el.getAttribute("data-framer-name") || ""
                    ).toLowerCase() === name ||
                    (el.textContent || "").trim().toLowerCase() ===
                        "replay the build"
                ) {
                    e.preventDefault()
                    replay()
                    return
                }
                el = el.parentElement
                    ? el.parentElement.closest("[data-framer-name]")
                    : null
            }
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        window.addEventListener("keydown", onKey)
        window.addEventListener("wheel", stopTour, { passive: true })
        window.addEventListener("touchstart", stopTour, { passive: true })
        document.addEventListener("click", onClick)

        const ease = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        const wrap = (a: number) => {
            while (a > Math.PI) a -= Math.PI * 2
            while (a < -Math.PI) a += Math.PI * 2
            return a
        }
        const measure = (el: HTMLElement): Line[] => {
            const base = el.getBoundingClientRect()
            const range = document.createRange()
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
            const lines: Line[] = []
            let node = walker.nextNode()
            while (node) {
                if ((node.textContent || "").trim()) {
                    range.selectNodeContents(node)
                    for (const r of Array.from(range.getClientRects())) {
                        if (r.width < 0.5) continue
                        const mid = (r.top + r.bottom) / 2 - base.top
                        const line = lines.find(
                            (l) => mid > l.top && mid < l.bottom
                        )
                        if (line) {
                            line.left = Math.min(line.left, r.left - base.left)
                            line.right = Math.max(
                                line.right,
                                r.right - base.left
                            )
                            line.top = Math.min(line.top, r.top - base.top)
                            line.bottom = Math.max(
                                line.bottom,
                                r.bottom - base.top
                            )
                        } else
                            lines.push({
                                top: r.top - base.top,
                                bottom: r.bottom - base.top,
                                left: r.left - base.left,
                                right: r.right - base.left,
                            })
                    }
                }
                node = walker.nextNode()
            }
            lines.sort((a, b) => a.top - b.top)
            return lines
        }
        const typeClip = (j: Job, a: Agent, t: number, r: DOMRect) => {
            const L = j.lines
            if (!L.length) {
                j.el.style.clipPath = "inset(0 " + (100 - t * 100) + "% 0 0)"
                a.cx = r.left + r.width * t
                a.cy = r.top
                a.ch = r.height
                return
            }
            let total = 0
            for (const l of L) total += l.right - l.left
            let rem = t * total
            let i = 0
            while (i < L.length - 1 && rem > L[i].right - L[i].left) {
                rem -= L[i].right - L[i].left
                i++
            }
            const cur = L[i]
            const x = cur.left + Math.min(rem, cur.right - cur.left)
            const top = i > 0 ? (L[i - 1].bottom + cur.top) / 2 : -20
            const bot =
                i < L.length - 1
                    ? (cur.bottom + L[i + 1].top) / 2
                    : r.height + 20
            j.el.style.clipPath =
                "polygon(-20px -20px, calc(100% + 20px) -20px, calc(100% + 20px) " +
                top +
                "px, " +
                x +
                "px " +
                top +
                "px, " +
                x +
                "px " +
                bot +
                "px, -20px " +
                bot +
                "px)"
            a.cx = r.left + x
            a.cy = r.top + cur.top
            a.ch = cur.bottom - cur.top
        }
        const done = (a: Agent, now: number) => {
            const j = a.job
            if (j) {
                restore(j)
                j.state = 2
                const layerName = (
                    j.el.getAttribute("data-framer-name") ||
                    j.el.getAttribute("aria-label") ||
                    j.el.textContent ||
                    j.kind
                )
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 42)
                setLogs((current) => [
                    ...current.slice(-7),
                    {
                        id: ++logId.current,
                        agent: a.name,
                        color: a.color,
                        action: `built ${layerName || j.kind}`,
                        time: Math.max(0, (now - buildStart) / 1000),
                    },
                ])
            }
            if (a.box) a.box.doneAt = now
            a.job = null
            a.box = null
            a.beam = false
            a.phase = "idle"
        }

        let raf = 0
        let running = false
        let last = performance.now()
        let frame = 0
        const stopLoop = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            running = false
        }
        const startLoop = () => {
            if (running || document.visibilityState === "hidden") return
            running = true
            last = performance.now()
            raf = requestAnimationFrame(tick)
        }
        const onVisibility = () => {
            if (document.visibilityState === "hidden") stopLoop()
            else startLoop()
        }
        document.addEventListener("visibilitychange", onVisibility)
        const onMotionChange = (event: MediaQueryListEvent) => {
            reducedMotion = event.matches
            if (reducedMotion) {
                skip()
                stopLoop()
                setOverlay(false)
                setHud((h) => ({ ...h, phase: "done", hidden: true, built: h.total, scan: h.total }))
            } else {
                start()
                startLoop()
            }
        }
        motionQuery?.addEventListener?.("change", onMotionChange)
        let hudAt = 0
        const tick = (now: number) => {
            if (document.visibilityState === "hidden") {
                stopLoop()
                return
            }
            if (reducedMotion) {
                stopLoop()
                return
            }
            const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
            last = now
            frame++
            if (window.location.pathname !== lastPath) {
                lastPath = window.location.pathname
                routeAt = now
                routeStable = 0
                routeOld = jobs
                    .filter((j) => j.kind !== "frame" || !j.parent)
                    .map((j) => j.el)
                if (propsRef.current.preloader) setOverlay(true)
            }
            if (routeAt) {
                let gone = 1
                if (routeOld.length) {
                    let off = 0
                    for (const el of routeOld) if (!el.isConnected) off++
                    gone = off / routeOld.length
                }
                const swapped = gone > 0.25 || now - routeAt > 3000
                if (swapped && !routeStable) routeStable = now
                if (routeStable && now - routeStable > 180) {
                    routeAt = 0
                    routeStable = 0
                    routeOld = []
                    scanMs = 1100
                    start()
                }
            }
            const P = propsRef.current
            const nextConfiguredSpeed = Math.max(1, Number(P.speed) || 1)
            if (nextConfiguredSpeed !== configuredSpeed) {
                configuredSpeed = nextConfiguredSpeed
                speed = configuredSpeed
            }
            const lineY = vh * Math.max(0.4, Math.min(0.98, Number(P.buildLine) || 0.86))
            const acc = col(P.accent, "#3B82F6")
            const chipC = col(P.chip, "#2563EB")
            let scanCount = 0
            const hasMouse = mx >= 0
            const cx = hasMouse ? mx : vw * 0.72
            const cy = hasMouse ? my : vh * 0.34

            if (phase === "scan") {
                const t = (now - phaseStart) / (scanMs / speed)
                scanCount = Math.round(Math.min(1, t) * jobs.length)
                const R = Math.min(150, Math.min(vw, vh) * 0.22)
                const base = (now / 1000) * 2.4
                agents.forEach((a, i) => {
                    const th =
                        base + (i % 2) * Math.PI - Math.floor(i / 2) * 0.21
                    a.tx = vw / 2 + Math.cos(th) * R
                    a.ty = vh / 2 + Math.sin(th) * R
                    a.k = 700
                    a.want = th + Math.PI / 2 - ARROW_DIR
                })
                if (t >= 1) {
                    phase = "build"
                    buildStart = now
                    setOverlay(false)
                }
            } else {
                const free = agents.filter((a) => !a.job)
                if (free.length && frame % 2 === 0) {
                    for (const j of jobs) {
                        if (!free.length) break
                        if (j.state !== 0) continue
                        if (j.parent && j.parent.state === 0) continue
                        const r = j.el.getBoundingClientRect()
                        if (r.top >= lineY) continue
                        let bi = 0
                        let bd = Infinity
                        free.forEach((a, i) => {
                            const d =
                                (a.x - r.left) * (a.x - r.left) +
                                (a.y - r.top) * (a.y - r.top)
                            if (d < bd) {
                                bd = d
                                bi = i
                            }
                        })
                        const a = free.splice(bi, 1)[0]
                        const box: Box = { job: j, p: 0, doneAt: 0 }
                        boxes.push(box)
                        j.state = 1
                        a.job = j
                        a.box = box
                        a.phase = "travel"
                        a.t0 = now
                    }
                }
                ringA += dt * 0.6
                agents.forEach((a, i) => {
                    const j = a.job
                    if (!j) {
                        const th = ringA + (i / n) * Math.PI * 2
                        const radius = Math.max(30, Math.min(160, Number(P.ringRadius) || 64))
                        a.tx = cx + Math.cos(th) * radius
                        a.ty = cy + Math.sin(th) * radius
                        a.k = 38 + ((i * 37) % 11) * 9
                        const sp = Math.hypot(a.vx, a.vy)
                        a.want =
                            (sp > 140
                                ? Math.atan2(a.vy, a.vx)
                                : Math.atan2(cy - a.y, cx - a.x)) - ARROW_DIR
                        return
                    }
                    lastBusy = now
                    a.want = 0
                    const r = j.el.getBoundingClientRect()
                    const box = a.box as Box
                    if (a.phase === "travel") {
                        a.tx = r.left
                        a.ty = r.top
                        a.k = 260
                        if (
                            Math.hypot(a.x - r.left, a.y - r.top) < 12 ||
                            now - a.t0 > 650 / speed
                        ) {
                            a.phase = "draw"
                            a.t0 = now
                        }
                    } else if (a.phase === "draw") {
                        const t = Math.min(1, (now - a.t0) / (340 / speed))
                        const e = ease(t)
                        box.p = e
                        a.tx = r.left + r.width * e
                        a.ty = r.top + r.height * e
                        a.k = 1100
                        if (t >= 1) {
                            if (j.kind === "text") {
                                j.lines = measure(j.el)
                                typeClip(j, a, 0, r)
                                a.phase = "type"
                                a.beam = true
                                a.t0 = now
                            } else if (j.kind === "leaf") {
                                j.el.style.clipPath = "inset(0 100% 0 0)"
                                a.phase = "fill"
                                a.t0 = now
                            } else done(a, now)
                        }
                    } else if (a.phase === "type") {
                        const dur =
                            Math.min(1700, Math.max(260, j.chars * 18)) / speed
                        const t = Math.min(1, (now - a.t0) / dur)
                        typeClip(j, a, t, r)
                        a.tx = a.cx + 3
                        a.ty = a.cy + a.ch * 0.5
                        a.k = 1100
                        if (t >= 1) done(a, now)
                    } else if (a.phase === "fill") {
                        const t = ease(
                            Math.min(1, (now - a.t0) / (380 / speed))
                        )
                        j.el.style.clipPath =
                            "inset(0 " + (100 - t * 100) + "% 0 0)"
                        a.tx = r.left + r.width * t
                        a.ty = r.top + r.height * 0.5
                        a.k = 900
                        if (t >= 1) done(a, now)
                    }
                })
            }

            for (const a of agents) {
                const K = Math.min(1200, a.k * (speed > 1 ? 1.3 : 1))
                const D = 2 * Math.sqrt(K) * 0.92
                const h = dt / 2
                for (let s = 0; s < 2; s++) {
                    a.vx += ((a.tx - a.x) * K - a.vx * D) * h
                    a.vy += ((a.ty - a.y) * K - a.vy * D) * h
                    a.x += a.vx * h
                    a.y += a.vy * h
                }
                a.ang += wrap(a.want - a.ang) * Math.min(1, dt * 9)
                a.tag += ((a.job ? 1 : 0) - a.tag) * Math.min(1, dt * 8)
            }

            if (touring) {
                window.scrollBy(0, 170 * speed * dt)
                if (
                    window.innerHeight + window.scrollY >=
                    document.documentElement.scrollHeight - 2
                )
                    touring = false
            }

            const busy = phase === "build" && now - lastBusy < 900
            chrome += ((busy ? 1 : 0) - chrome) * Math.min(1, dt * 5)

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, vw, vh)
            ctx.textAlign = "left"
            ctx.textBaseline = "alphabetic"

            boxes = boxes.filter(
                (b) => !b.doneAt || now - b.doneAt < 250 / speed + 450
            )
            const live: { l: number; t: number; w: number; h: number }[] = []
            for (const b of boxes) {
                const r = b.job.el.getBoundingClientRect()
                const w = r.width * b.p
                const h = r.height * b.p
                if (!b.doneAt) live.push({ l: r.left, t: r.top, w, h })
                if (r.bottom < -40 || r.top > vh + 40) continue
                const al = b.doneAt
                    ? Math.max(0, 1 - (now - b.doneAt - 250 / speed) / 400)
                    : 1
                if (al <= 0) continue
                const x0 = Math.round(r.left) + 0.5
                const y0 = Math.round(r.top) + 0.5
                if (!b.doneAt && chrome > 0.05) {
                    ctx.save()
                    ctx.globalAlpha = 0.2 * chrome
                    ctx.strokeStyle = acc
                    ctx.setLineDash([2, 3])
                    ctx.beginPath()
                    ctx.moveTo(0, y0)
                    ctx.lineTo(vw, y0)
                    ctx.moveTo(0, y0 + h)
                    ctx.lineTo(vw, y0 + h)
                    ctx.moveTo(x0, 0)
                    ctx.lineTo(x0, vh)
                    ctx.moveTo(x0 + w, 0)
                    ctx.lineTo(x0 + w, vh)
                    ctx.stroke()
                    ctx.restore()
                }
                ctx.globalAlpha = al
                ctx.strokeStyle = acc
                ctx.lineWidth = 1
                ctx.strokeRect(x0, y0, Math.round(w), Math.round(h))
                const corners = [
                    [x0, y0],
                    [x0 + w, y0],
                    [x0, y0 + h],
                    [x0 + w, y0 + h],
                ]
                for (const c of corners) {
                    ctx.fillStyle = "#ffffff"
                    ctx.fillRect(c[0] - 2.5, c[1] - 2.5, 5, 5)
                    ctx.strokeRect(c[0] - 2.5, c[1] - 2.5, 5, 5)
                }
                const label = Math.round(w) + " × " + Math.round(h)
                ctx.font = "600 9px " + MONO
                const tw = ctx.measureText(label).width
                const bw = tw + 10
                const bx = x0 + w / 2 - bw / 2
                const by = y0 + h + 7
                rr(ctx, bx, by, bw, 14, 3)
                ctx.fillStyle = chipC
                ctx.fill()
                ctx.fillStyle = "#ffffff"
                ctx.textBaseline = "middle"
                ctx.fillText(label, bx + 5, by + 7.5)
                ctx.textBaseline = "alphabetic"
            }
            ctx.globalAlpha = 1

            if (chrome > 0.01) {
                if (P.rulers) {
                    const T = 18
                    const sy = window.scrollY
                    ctx.globalAlpha = chrome
                    ctx.fillStyle = "rgba(12,14,18,0.96)"
                    ctx.fillRect(0, 0, vw, T)
                    ctx.fillRect(0, 0, T, vh)
                    ctx.globalAlpha = chrome * 0.6
                    ctx.fillStyle = acc
                    for (const b of live) {
                        ctx.fillRect(b.l, 0, b.w, T)
                        ctx.fillRect(0, b.t, T, b.h)
                    }
                    ctx.globalAlpha = chrome
                    ctx.strokeStyle = "#353b47"
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    for (let x = 0; x < vw; x += 10) {
                        const len = x % 100 === 0 ? T : x % 50 === 0 ? 7 : 4
                        ctx.moveTo(x + 0.5, T - len)
                        ctx.lineTo(x + 0.5, T)
                    }
                    for (let y = -(sy % 10); y < vh; y += 10) {
                        const v = Math.round(y + sy)
                        const len = v % 100 === 0 ? T : v % 50 === 0 ? 7 : 4
                        ctx.moveTo(T - len, Math.round(y) + 0.5)
                        ctx.lineTo(T, Math.round(y) + 0.5)
                    }
                    ctx.stroke()
                    ctx.fillStyle = "#5d6472"
                    ctx.font = "500 8px " + MONO
                    for (let x = 100; x < vw; x += 100)
                        ctx.fillText(String(x), x + 3, 9)
                    for (let y = -(sy % 100); y < vh; y += 100) {
                        const v = Math.round(y + sy)
                        if (v <= 0) continue
                        ctx.save()
                        ctx.translate(10, y - 3)
                        ctx.rotate(-Math.PI / 2)
                        ctx.fillText(String(v), 0, 0)
                        ctx.restore()
                    }
                    ctx.fillStyle = "#1d2129"
                    ctx.fillRect(0, T, vw, 1)
                    ctx.fillRect(T, 0, 1, vh)
                }
                ctx.globalAlpha = chrome * 0.85
                ctx.fillStyle = "#ef4444"
                ctx.fillRect(0, Math.round(lineY), vw, 1)
                ctx.font = "600 8px " + MONO
                ctx.textAlign = "right"
                ctx.fillText("BUILD LINE", vw - 14, lineY - 5)                ctx.textAlign = "left"
                ctx.globalAlpha = 1
            }

            for (const a of agents) {
                if (a.phase === "type") {
                    ctx.fillStyle = a.color
                    ctx.fillRect(a.cx, a.cy, 1.5, a.ch)
                }
                ctx.save()
                ctx.translate(a.x, a.y)
                if (a.beam) {
                    ctx.strokeStyle = a.color
                    ctx.lineWidth = 2
                    ctx.lineCap = "round"
                    ctx.beginPath()
                    ctx.moveTo(-3, -7)
                    ctx.lineTo(3, -7)
                    ctx.moveTo(0, -7)
                    ctx.lineTo(0, 7)
                    ctx.moveTo(-3, 7)
                    ctx.lineTo(3, 7)
                    ctx.stroke()
                } else {
                    ctx.rotate(a.ang)
                    ctx.shadowColor = "rgba(0,0,0,0.45)"
                    ctx.shadowBlur = 4
                    ctx.shadowOffsetY = 1
                    ctx.fillStyle = a.color
                    ctx.fill(arrow)
                    ctx.shadowColor = "transparent"
                    ctx.lineWidth = 1.2
                    ctx.lineJoin = "round"
                    ctx.strokeStyle = "rgba(255,255,255,0.92)"
                    ctx.stroke(arrow)
                }
                ctx.restore()
                if (a.tag > 0.03) {
                    ctx.globalAlpha = a.tag
                    ctx.font = "700 9px Inter, system-ui, sans-serif"
                    const tw = ctx.measureText(a.name).width
                    const bx = a.x + (a.beam ? 6 : 9)
                    const by = a.y + (a.beam ? 9 : 17)
                    rr(ctx, bx, by, tw + 12, 14, 7)
                    ctx.fillStyle = a.color
                    ctx.fill()
                    ctx.fillStyle = "#0b0d10"
                    ctx.textBaseline = "middle"
                    ctx.fillText(a.name, bx + 6, by + 7.5)
                    ctx.textBaseline = "alphabetic"
                    ctx.globalAlpha = 1
                }
            }

            if (now - hudAt > 90) {
                hudAt = now
                let built = 0
                for (const j of jobs) if (j.state === 2) built++
                if (!buildEnd && phase === "build" && built === jobs.length)
                    buildEnd = now
                const st: Hud = {
                    phase:
                        phase === "scan" ? "scan" : buildEnd ? "done" : "build",
                    built,
                    total: jobs.length,
                    scan: scanCount,
                    speed,
                    time: buildEnd
                        ? Math.max(0, buildEnd - buildStart) / 1000
                        : 0,
                    hidden: hudHidden,
                }
                setHud((prev) =>
                    prev.phase === st.phase &&
                    prev.built === st.built &&
                    prev.total === st.total &&
                    prev.scan === st.scan &&
                    prev.speed === st.speed &&
                    prev.hidden === st.hidden &&
                    prev.time === st.time
                        ? prev
                        : st
                )
            }
            const complete = phase === "build" && jobs.every((j) => j.state === 2) && !routeAt
            if (complete && now - lastPointerAt > 1800) {
                raf = 0
                running = false
                return
            }
            raf = requestAnimationFrame(tick)
        }

        start()
        startLoop()
        return () => {
            stopLoop()
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("resize", resize)
            resizeObserver?.disconnect()
            motionQuery?.removeEventListener?.("change", onMotionChange)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("keydown", onKey)
            window.removeEventListener("wheel", stopTour)
            window.removeEventListener("touchstart", stopTour)
            document.removeEventListener("click", onClick)
            jobs.forEach(restore)
        }
    }, [isCanvas, agentCount])

    if (isCanvas) {
        return (
            <div
                style={{
                    ...props.style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    background: "rgba(47,107,255,0.12)",
                    border: "1px dashed " + col(p.accent, "#3B82F6"),
                    color: "#cfd8ff",
                    font: "600 11px " + MONO,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                }}
            >
                Karim Saif — Swarm Build · runs in Preview
            </div>
        )
    }

    const accent = col(p.accent, "#3B82F6")
    const btn: React.CSSProperties = {
        border: "none",
        outline: "none",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: 6,
        background: "#1b1e25",
        color: "#e7e9ee",
        font: "500 11px " + MONO,
        lineHeight: "14px",
    }
    const pct =
        hud.phase === "scan"
            ? hud.total
                ? hud.scan / hud.total
                : 0
            : hud.total
              ? hud.built / hud.total
              : 0
    const isDone = hud.phase === "done"

    if (typeof document === "undefined") return null

    return createPortal(
        <div
            ref={rootRef}
            data-swarm-overlay="true"
            aria-label="Swarm Build animation overlay"
            style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 9997,
                pointerEvents: "none",
                overflow: "visible",
            }}
        >
            <div
                data-swarm-overlay="true"
                aria-hidden="true"
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 9997,
                    background: col(p.background, "#0B0D10"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: overlay ? 1 : 0,
                    visibility: overlay ? "visible" : "hidden",
                    transition:
                        "opacity 0.6s ease, visibility 0s linear " +
                        (overlay ? "0s" : "0.6s"),
                    pointerEvents: overlay ? "auto" : "none",
                }}
            >
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: "#141821",
                        border: "1px solid #283041",
                        boxShadow:
                            "0 0 0 5px rgba(47,107,255,0.06), 0 10px 30px rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <rect
                            x="2"
                            y="2"
                            width="22"
                            height="22"
                            rx="5"
                            stroke="#9aa6bd"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                        />
                        <path
                            d="M9 7 L9 18 L12 15.2 L14.1 19.6 L15.9 18.8 L13.9 14.5 L17.8 14.5 Z"
                            fill={accent}
                        />
                    </svg>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                data-swarm-overlay="true"
                aria-hidden="true"
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 9999,
                    pointerEvents: "none",
                }}
            />
            {p.agentLog !== false && !isCanvas && (
                <div
                    data-swarm-overlay="true"
                    role="region"
                    aria-label="Swarm Build agent activity log"
                    style={{
                        position: "fixed",
                        top: mobile ? 12 : 18,
                        right: mobile ? 12 : 18,
                        width: mobile ? "min(290px, calc(100vw - 24px))" : 292,
                        maxHeight: mobile ? "34vh" : 250,
                        overflow: "hidden",
                        zIndex: 10001,
                        boxSizing: "border-box",
                        padding: 12,
                        borderRadius: 11,
                        border: "1px solid #29303b",
                        background: "rgba(17,19,24,0.94)",
                        boxShadow: "0 12px 32px rgba(0,0,0,0.38)",
                        color: "#e7e9ee",
                        font: "500 10px " + MONO,
                        pointerEvents: "auto",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            paddingBottom: 9,
                            borderBottom: "1px solid #29303b",
                            color: "#9ba4b3",
                            letterSpacing: "1px",
                            fontSize: 9,
                            fontWeight: 700,
                        }}
                    >
                        <span>AGENT ACTIVITY</span>
                        <span style={{ color: "#e7e9ee", letterSpacing: 0 }}>
                            {hud.built} / {hud.total || "—"} BUILT
                        </span>
                    </div>
                    <div
                        aria-live="off"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 7,
                            paddingTop: 10,
                            maxHeight: mobile ? "calc(34vh - 54px)" : 178,
                            overflowY: "auto",
                        }}
                    >
                        {logs
                            .slice(-Math.max(1, Math.min(8, p.logRows || 4)))
                            .map((entry) => (
                                <div
                                    key={entry.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7,
                                        minWidth: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            borderRadius: 4,
                                            padding: "3px 5px",
                                            background: entry.color,
                                            color: "#101216",
                                            fontWeight: 800,
                                            fontSize: 9,
                                        }}
                                    >
                                        {entry.agent}
                                    </span>
                                    <span
                                        style={{
                                            minWidth: 0,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            color: "#c3c9d3",
                                        }}
                                    >
                                        {entry.action}
                                    </span>
                                    <span
                                        style={{
                                            marginLeft: "auto",
                                            flexShrink: 0,
                                            color: "#697384",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {entry.time.toFixed(1)}s
                                    </span>
                                </div>
                            ))}
                        {logs.length === 0 && (
                            <span
                                style={{ color: "#788292", padding: "5px 0" }}
                            >
                                {hud.phase === "done"
                                    ? "Build complete — ready to rebuild"
                                    : hud.phase === "scan"
                                      ? "Agents are scanning the page…"
                                      : "Agents are waiting for their first task…"}
                            </span>
                        )}
                    </div>
                </div>
            )}
            {p.hud && !hud.hidden && (
                <div
                    style={{
                        position: "fixed",
                        left: mobile ? 12 : "50%",
                        right: mobile ? 12 : "auto",
                        bottom: mobile ? 12 : 22,
                        transform: mobile ? "none" : "translateX(-50%)",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: mobile ? "space-between" : "flex-start",
                        gap: mobile ? 8 : 10,
                        padding: mobile
                            ? "8px 8px 8px 12px"
                            : "6px 6px 6px 10px",
                        boxSizing: "border-box",
                        background: "rgba(17,19,24,0.94)",
                        border: "1px solid #252932",
                        borderRadius: 11,
                        boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                        color: "#a9afbb",
                        font: "500 11px " + MONO,
                        whiteSpace: "nowrap",
                        pointerEvents: "auto",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    {hud.phase === "scan" ? (
                        <span
                            style={
                                mobile
                                    ? {
                                          flex: 1,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                      }
                                    : undefined
                            }
                        >
                            Scanning page…{" "}
                            <span style={{ color: "#fff" }}>{hud.scan}</span>{" "}
                            layers
                        </span>
                    ) : isDone ? (
                        <span
                            style={
                                mobile
                                    ? {
                                          flex: 1,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                      }
                                    : undefined
                            }
                        >
                            Rebuilt{" "}
                            <span style={{ color: "#fff" }}>{hud.total}</span>{" "}
                            layers in {hud.time.toFixed(1)}s
                        </span>
                    ) : (
                        <>
                            <span style={{ display: tiny ? "none" : "flex" }}>
                                {COLORS.slice(0, 5).map((c, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            width: 15,
                                            height: 15,
                                            borderRadius: 8,
                                            background: c,
                                            marginLeft: i ? -5 : 0,
                                            border: "1.5px solid #111318",
                                            color: "#0b0d10",
                                            font: "700 8px Inter, sans-serif",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {NAMES[i][0]}
                                    </span>
                                ))}
                            </span>
                            <span style={{ color: "#6f7684" }}>
                                {agentCount} agents
                            </span>
                            <span style={{ color: "#e7e9ee" }}>
                                {hud.built} / {hud.total} layers
                            </span>
                        </>
                    )}
                    {!isDone && (
                        <span
                            style={{
                                width: mobile ? "auto" : 52,
                                flex: mobile ? 1 : "none",
                                minWidth: mobile ? 24 : 52,
                                height: 3,
                                borderRadius: 2,
                                background: "#262a33",
                                overflow: "hidden",
                                display: "block",
                            }}
                        >
                            <span
                                style={{
                                    display: "block",
                                    height: "100%",
                                    width: pct * 100 + "%",
                                    background: accent,
                                    transition: "width 0.2s",
                                }}
                            />
                        </span>
                    )}
                    <button
                        type="button"
                        aria-label={isDone ? "Rebuild page layers" : "Skip page build animation"}
                        title={isDone ? "Rebuild" : "Skip"}
                        style={{
                            ...(mobile ? { ...btn, padding: "7px 10px" } : btn),
                            background: accent,
                            color: "#fff",
                            fontWeight: 700,
                        }}
                        onClick={() =>
                            isDone ? api.current.replay() : api.current.skip()
                        }
                        onFocus={(e) => { e.currentTarget.style.outline = "2px solid #ffffff"; e.currentTarget.style.outlineOffset = "2px" }}
                        onBlur={(e) => { e.currentTarget.style.outline = "none" }}
                    >
                        {isDone ? "REBUILD" : "SKIP"}
                    </button>
                    <button
                        type="button"
                        aria-label="Change animation speed"
                        title="Change animation speed"
                        style={mobile ? { ...btn, padding: "7px 10px" } : btn}
                        onClick={() => api.current.cycle()}
                        onFocus={(e) => { e.currentTarget.style.outline = "2px solid #ffffff"; e.currentTarget.style.outlineOffset = "2px" }}
                        onBlur={(e) => { e.currentTarget.style.outline = "none" }}
                    >
                        {hud.speed}×
                    </button>
                </div>
            )}
        </div>,
        document.body
    )
}

addPropertyControls(SwarmBuild, {
    agents: {
        type: ControlType.Number,
        title: "Agents",
        description:
            "Number of animated cursor agents working across the page.",
        min: 3,
        max: 20,
        step: 1,
        defaultValue: 14,
    },
    speed: {
        type: ControlType.Enum,
        title: "Speed",
        description:
            "Global animation speed for scanning and layer construction.",
        options: [1, 2, 4],
        optionTitles: ["1×", "2×", "4×"],
        defaultValue: 1,
    },
    preloader: {
        type: ControlType.Boolean,
        title: "Preloader",
        description:
            "Show the full-screen intro before agents begin rebuilding the page.",
        defaultValue: true,
    },
    background: {
        type: ControlType.Color,
        title: "Preloader BG",
        description: "Background color used by the full-screen preloader.",
        defaultValue: "#0B0D10",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        description:
            "Accent color for progress indicators and the primary action.",
        defaultValue: "#3B82F6",
    },
    chip: {
        type: ControlType.Color,
        title: "Size Chip",
        description:
            "Color used for the small measurement labels around selected layers.",
        defaultValue: "#2563EB",
    },
    buildLine: {
        type: ControlType.Number,
        title: "Build Line",
        description:
            "Viewport height ratio below which page layers become eligible for building.",
        min: 0.4,
        max: 0.98,
        step: 0.01,
        defaultValue: 0.86,
    },
    rulers: {
        type: ControlType.Boolean,
        title: "Rulers",
        description:
            "Show measurement guides and selection dimensions while agents work.",
        defaultValue: true,
    },
    hud: {
        type: ControlType.Boolean,
        title: "HUD",
        description:
            "Show the fixed bottom control bar with progress, speed, and Skip/Rebuild.",
        defaultValue: true,
    },
    ringRadius: {
        type: ControlType.Number,
        title: "Ring Radius",
        description:
            "Distance between idle agents as they orbit the current pointer position.",
        min: 30,
        max: 160,
        step: 1,
        defaultValue: 64,
    },
    replayName: {
        type: ControlType.String,
        title: "Replay Layer",
        description:
            "Framer layer name that can trigger a fresh build when clicked.",
        defaultValue: "Replay Button",
    },
    agentLog: {
        type: ControlType.Boolean,
        title: "Agent Log",
        description:
            "Show the floating activity panel with completed agent tasks.",
        defaultValue: true,
    },
    logRows: {
        type: ControlType.Number,
        title: "Log Rows",
        description:
            "Maximum number of recent completed tasks shown in the Agent Log.",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 4,
    },
})