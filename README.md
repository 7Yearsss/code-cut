# code-cut

A Claude Code MCP plugin for AI-driven video editing with real-time preview.

## Core idea

Unlike Remotion/Hyperframes (code → render → video pipeline), code-cut uses a **scene graph + layer model**:

- AI operates on JSON data, not generated code
- Each layer (footage, Lottie animation, subtitle) is independent and cached
- Changes to one layer never re-render others
- Preview is live in a localhost web UI — no render wait

## Architecture

```
MCP Server (TypeScript)
  └── Exposes tools to Claude Code AI
  └── Maintains project.json (scene graph)
  └── Drives localhost Web UI

Web UI (localhost)
  ├── <video> layer    — footage, plays natively
  ├── Lottie layer     — AI-generated motion overlays
  └── Subtitle layer   — text, instant CSS updates
```

## Status

🚧 Early development
