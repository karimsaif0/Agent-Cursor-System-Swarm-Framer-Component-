# Agent Cursor System Swarm

<p align="center">
  <strong>A coordinated swarm of animated cursor agents, built as a self-contained Framer experience.</strong>
</p>

<p align="center">
  <a href="https://agentcursorsystemswarm.framer.website/">Live Preview</a>
  ·
  <a href="./Agent_Cursor_System_Swarm.tsx">Framer Component Source</a>
  ·
  <a href="https://x.com/karimsaif0">Creator on X</a>
</p>

---

## Overview

**Agent Cursor System Swarm** brings the visual language of a collaborative agent workflow into a Framer Code Component. Multiple animated cursor agents orbit a focused build area while a technical interface communicates progress, activity, and system status.

The experience includes a futuristic HUD, measurement guides, an agent activity panel, a scanning line, progress feedback, and replay controls. All visual activity is contained within the component's own frame.

**Created by Karim Saif.**

## Live Preview

Explore the experience:

**[agentcursorsystemswarm.framer.website](https://agentcursorsystemswarm.framer.website/)**

## Features

- **Animated agent swarm** — configure up to 20 cursor agents with individual colors and labels.
- **Self-contained build stage** — the visual build sequence runs inside the component's own rendered area.
- **Technical measurement guides** — optional ruler marks and a configurable scan line.
- **Agent activity panel** — show a compact log of build-stage activity.
- **Progress HUD** — display progress, agent count, and build status.
- **Replay and skip controls** — restart or complete the local animation sequence.
- **Pause and resume** — control the animation from the component interface.
- **Custom styling** — configure background, accent, chip color, agent count, speed, and orbit radius.
- **Static-rendering fallback** — renders a designed static composition in Framer static contexts.
- **Visibility-aware animation** — uses IntersectionObserver to pause animation while the component is offscreen.
- **Reduced-motion support** — completes the visual sequence without continuous motion when reduced motion is requested.
- **Responsive layout** — adapts the stage and controls to the available component size.

## Framer Controls

| Control | Description |
| --- | --- |
| Agents | Number of animated cursor agents. |
| Speed | Animation speed: 1×, 2×, or 4×. |
| Preloader | Shows the initialization screen inside the component. |
| Preloader BG | Sets the stage and fallback background. |
| Accent | Sets the main accent color. |
| Size Chip | Sets secondary label and indicator color. |
| Build Line | Sets the scan guide's vertical position. |
| Rulers | Shows or hides technical measurement marks. |
| HUD | Shows or hides the progress and action controls. |
| Ring Radius | Sets the agents' orbit radius. |
| Replay Label | Sets the accessible name for the rebuild action. |
| Agent Log | Shows or hides the activity panel. |
| Log Rows | Sets the maximum number of activity entries. |

All listed properties are exposed through Framer's property controls.

## Installation

1. Open your Framer project.
2. Add a new Code Component.
3. Open [`Agent_Cursor_System_Swarm.tsx`](./Agent_Cursor_System_Swarm.tsx).
4. Copy the complete source into the Framer Code Editor.
5. Add the component to your page and size its frame.
6. Customize the properties in the right-hand panel.
7. Preview the page and publish when ready.

## Component Boundaries and Compatibility

This component is intentionally self-contained:

- It does not scan the host page or query unrelated page elements.
- It does not change styles or attributes on elements outside its own rendered output.
- It does not attach click handlers to unrelated page elements.
- It does not create a full-window portal or overlay.
- Its canvas, controls, HUD, and visual build stage are rendered within its own frame.

The component uses Framer's `useIsStaticRenderer` hook to provide a lightweight static fallback. Animation is gated by `IntersectionObserver` and pauses when the component is offscreen. A `ResizeObserver` keeps the canvas aligned with the component's own dimensions.

The animated agents visually represent a build workflow inside the component. They do not operate on or rebuild arbitrary content elsewhere on the host page.

## Support

Created by **Karim Saif**.

- **X:** [@karimsaif0](https://x.com/karimsaif0)
- **Email:** [karimsaif010@gmail.com](mailto:karimsaif010@gmail.com)
- **Live Preview:** [agentcursorsystemswarm.framer.website](https://agentcursorsystemswarm.framer.website/)

For questions, feedback, or collaboration, reach out through X or email.

---

<p align="center">Made with 💛 by Karim Saif</p>
