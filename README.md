# Agent Cursor System Swarm

<p align="center">
  <strong>A self-contained swarm of animated cursor agents for Framer.</strong><br />
  An isolated interactive build-system visual, designed to live safely inside its own component frame.
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

**Agent Cursor System Swarm** brings a coordinated team of animated cursor agents into a self-contained Framer component. Agents move between visual build cards, trace progress, and create the atmosphere of a miniature interface-construction system.

The experience includes a compact HUD, agent activity panel, measurement ticks, orbit behavior, and a polished static fallback.

**Created by Karim Saif.**

## Live Preview

[Open the live preview](https://agentcursorsystemswarm.framer.website/)

## Features

- Animated multi-agent cursor swarm rendered on a local canvas.
- Self-contained visual build cards and progressive scan effects.
- Pointer-responsive agent orbit contained within the component.
- Configurable agent count and animation speed.
- Custom accent, background, and panel colors.
- Optional activity log, HUD, and measurement rulers.
- Responsive canvas sizing with a capped device pixel ratio.
- Animation starts only while the component is visible.
- Animation, observers, and local pointer listeners are cleaned up on unmount.
- Framer static-renderer detection with a lightweight non-animated fallback.
- No host-page scanning, global overlays, or mutation of unrelated page elements.

## Framer Controls

| Control | Description |
| --- | --- |
| Agents | Number of animated agents inside the component. |
| Speed | Progression speed of the local build sequence. |
| Accent | Cursor, scan, and progress accent color. |
| Background | Background color of the component stage. |
| Panel | Color used by static preview cards. |
| Agent Log | Shows or hides the local activity panel. |
| HUD | Shows or hides the local progress display. |
| Rulers | Shows or hides measurement ticks. |
| Ring Radius | Sets the agents' orbit radius around the local pointer. |
| Build Layers | Sets the number of visual build cards. |

Every control includes a description in Framer's property panel.

## Installation

1. Open your Framer project.
2. Add a Code Component.
3. Open [`SwarmBuild.tsx`](./SwarmBuild.tsx) in this repository.
4. Copy the complete source into your Framer Code Component.
5. Add the component to your page and resize its frame.
6. Adjust the controls in the Framer property panel.

## Scope and Compatibility

This version is intentionally self-contained. It animates only the canvas, cards, HUD, and pointer interaction rendered by its own component. It does **not** inspect, select, hide, restyle, or attach click handlers to arbitrary elements elsewhere on the host page.

The animation uses `useIsStaticRenderer` to disable animated work in static rendering contexts. In interactive rendering, a local `IntersectionObserver` starts and pauses the animation according to the component's visibility. A local `ResizeObserver` handles frame-size changes.

The component is a visual swarm simulation. It does not operate real AI agents or rebuild the surrounding website's actual content.

## Support

Created by **Karim Saif**.

- **X:** [@karimsaif0](https://x.com/karimsaif0)
- **Email:** [karimsaif010@gmail.com](mailto:karimsaif010@gmail.com)
- **Live Preview:** [agentcursorsystemswarm.framer.website](https://agentcursorsystemswarm.framer.website/)

---

<p align="center">Made with 💛 by Karim Saif</p>
