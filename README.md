# Agent Cursor System Swarm

<p align="center">
  <strong>A coordinated swarm of animated cursor agents for Framer.</strong><br />
  Scan, reveal, and bring your page to life with a futuristic build-system experience.
</p>

<p align="center">
  <a href="https://agentcursorsystemswarm.framer.website/">Live Preview</a>
  ·
  <a href="https://github.com/karimsaif0/Agent-Cursor-System-Swarm-Framer-Component-/blob/main/SwarmBuild.tsx">Component Source</a>
  ·
  <a href="https://x.com/karimsaif0">Creator on X</a>
</p>

---

## Overview

**Agent Cursor System Swarm** transforms a Framer website into a live, coordinated build environment. Multiple animated cursor agents move across the page, inspect eligible elements, and reveal them through a sequence of scanning and construction effects.

A technical HUD, measurement rulers, progress feedback, and an agent activity log complete the experience. It is designed as an expressive visual layer for websites that want a distinctive AI-inspired, futuristic atmosphere.

**Created by Karim Saif.**

## Live Preview

Explore the live experience:

**[agentcursorsystemswarm.framer.website](https://agentcursorsystemswarm.framer.website/)**

## Features

- **Multi-agent animation** — a configurable team of animated cursor agents.
- **Page scanning** — discovers eligible Framer page elements for the build sequence.
- **Progressive reveal** — animates text and visual elements as agents work.
- **Futuristic HUD** — adds system-style status and progress information.
- **Agent activity log** — shows a rolling record of completed agent actions.
- **Measurement rulers** — adds technical measurement details around the viewport.
- **Build-line control** — adjusts the vertical build threshold.
- **Custom visual styling** — configure the background, accent, and agent chip colors.
- **Replay and skip behavior** — replay the experience or skip the current sequence.
- **Motion accessibility** — responds to the visitor's reduced-motion preference.
- **Responsive presentation** — adapts its interface for smaller viewports.
- **Canvas fallback** — displays a lightweight placeholder in the Framer editor canvas.

## Framer Controls

Customize the component from Framer's property panel:

| Control | Description |
| --- | --- |
| Agents | Sets the number of animated agents. |
| Speed | Controls the animation pace. |
| Preloader | Enables or disables the initial scanning preloader. |
| Background | Sets the experience background color. |
| Accent | Sets the primary scanning and HUD accent color. |
| Chip | Sets the measurement label color. |
| Build Line | Adjusts the build-line position. |
| Rulers | Shows or hides measurement rulers. |
| HUD | Shows or hides the heads-up display. |
| Ring Radius | Adjusts the orbit radius around the pointer. |
| Replay Name | Sets the layer name used for replay interaction. |
| Agent Log | Shows or hides the activity log. |
| Log Rows | Sets the number of visible activity entries. |

Every property is exposed through Framer controls; no source edits are required for normal customization.

## Installation

1. Open your Framer project.
2. Add a new **Code Component**.
3. Copy the complete source from [`SwarmBuild.tsx`](./SwarmBuild.tsx).
4. Paste it into the Code Editor and save.
5. Add **SwarmBuild** to the page.
6. Preview the published page and adjust the component properties.

The component uses React and Framer's built-in APIs. It is intended to run as a Framer Code Component, not as a standalone HTML snippet.

## Excluding Page Elements

To keep a specific element out of the scanning and reveal sequence, add this attribute to the element:

```html
data-swarm-ignore="true"
```

This is useful for forms, important interactive controls, or content that should remain visible while the agents work.

## Compatibility Notes

- The component scans eligible elements in the rendered page and relies partly on Framer-generated DOM attributes. Framer may change its internal markup over time.
- Test the experience on your own page, especially if it contains complex nested components, forms, fixed navigation, or custom interactions.
- Reduced-motion settings are respected; visitors who request reduced motion receive a non-animated completion state.
- The component is a visual interaction layer. It does not connect to or run actual AI agents.

## Support

Created by **Karim Saif**.

- **X:** [@karimsaif0](https://x.com/karimsaif0)
- **Email:** [karimsaif010@gmail.com](mailto:karimsaif010@gmail.com)
- **Live Preview:** [agentcursorsystemswarm.framer.website](https://agentcursorsystemswarm.framer.website/)

For questions, feedback, or collaboration, reach out through X or email.

---

<p align="center">
  Made with 💛 by Karim Saif
</p>
