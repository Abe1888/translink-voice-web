# 🌐 TRANSLINK — Advanced 3D Telematics Platform

An immersive, infinite-scroll 3D telematics and IoT presentation platform. The web application synchronizes a high-precision Three.js scene graph with an overlaying HUD layer containing interactive 3D telemetry indicators, client tracking, and vector morphing assets.

---

## 🚀 Active Project Entry Point

* **Production Entry Point:** [`index.html`](file:///c:/Users/Abebaw/Desktop/TRANSLINK_CMS/TRANSLINK_WEB/index.html) — Unified scroll-driven 3D platform.
* **Core Application Bootstrapper:** [`src/translink/main.ts`](file:///c:/Users/Abebaw/Desktop/TRANSLINK_CMS/TRANSLINK_WEB/src/translink/main.ts) — Orchestrates the mounting, smooth scrolling, HUD components, and the 3D SceneBridge connector.

---

## 🛠️ Tech Stack & Key Technologies

* **Core Engine:** Vanilla HTML5, TypeScript, and **Three.js (0.175.0)** with GPU-accelerated meshopt and Draco loaders.
* **Scroll & Physics:** **GSAP (ScrollTrigger)** and **Lenis (1.3.16)** smooth scrolling with frame-rate independent easing.
* **Animation & Vector Graphics:** **Anime.js (4.4.1)** (driving path tangent rotations) and **Flubber (0.4.2)** (handling seamless SVG morphing).
* **Styling System:** Vanilla CSS utility layers paired with **TailwindCSS (3.4.17)** for structural responsive grids.
* **Bundler & Tooling:** **Vite (6.2.5)** with page-level deterministic code-splitting manual chunks and **TypeScript (5.9.3)** strict compiler typing.

---

## 📦 Project Structure

```
TRANSLINK_WEB/
├── dist/                     # Optimized, production-ready build output
├── docs/                     # Authoritative system documentation
│   ├── cleanup_report.md     # Optimization audit and deleted resources log
│   ├── Scroll-Issues.md      # Resolution guide for canvas scrollbars & zoom
│   ├── optimization_plan.md  # Core 3D engine and manual chunk split plans
│   ├── performance_audit.md  # GPU, memory, and frame-rate optimization checks
│   ├── client.md             # Client integration details
│   ├── mothionpath.md        # Technical math for path tangent calculations
│   └── Easter.html           # Mockups for telemetry interactive egg
├── public/                   # Static browser-accessible assets
│   ├── models/               # Meshopt compressed GLB assets (truck & sensor)
│   ├── textures/             # HDRI environmental maps and UI icons
│   └── images/               # Client logos and services card graphics
├── src/                      # Source Code
│   ├── translink/            # Primary HUD Overlay & Layout Systems
│   │   ├── components/       # Global HUD elements (sound toggle, cursors, loaders)
│   │   ├── controllers/      # Nav, scroll engines, and interaction handlers
│   │   ├── translinkS1-S10/  # 10 dedicated presentation sections (controllers/views)
│   │   └── main.ts           # Global bootstrapper and physical loop clone
│   ├── translinkbridge/      # 3D Scene Bridge & Waypoints synchronizer
│   ├── translinkconfig/      # Authority configurations (camera, audio, translations)
│   └── translinkscene/       # autorun Three.js World scene graph engines
└── vite.config.ts            # Page-level code-splitting Rollup config
```

---

## 🗺️ Presentation Sections (S1 – S10)

The HUD layer animates 10 premium telemetry sections mapped dynamically to the fixed 3D camera timeline:

1. **S1: Translink Hero** — Cinematic military-grade tracking introduction.
2. **S2: Translink Tracking** — High-precision GNSS/GPS fleet visibility.
3. **S3: Translink Fuel** — Advanced fuel analytics and consumption prevention.
4. **S4: Translink CAN/OBD** — Deep vehicle diagnostic telemetry and engine health.
5. **S5: Translink Fleet** — Large-scale logistics and asset distribution.
6. **S6: Translink Diagnostics** — Proactive maintenance modules.
7. **S7: Translink Sensor Network** — Ultrasonic IoT and temperature sensors.
8. **S8: Translink AI / IoT** — Edge intelligence and hybrid operations.
9. **S9: Translink Vision** — ADAS & DMS windshield video telematics.
10. **S10: Translink Contact** — Responsive technical support gateway.

---

## ⚡ Developer Guide

All scripts are executed via **`npm`** (avoid `pnpm` or `yarn` to prevent cache alignment issues):

### 1. Run Development Server
Spins up Vite local dev environment on port `3001`:
```bash
npm run dev
```

### 2. Verify Strict Types
Deterministic checks of all inputs, imports, and variables:
```bash
npm run type-check
```

### 3. Build Production Bundle
Type-checks the source and bundles assets with manual chunk splits:
```bash
npm run build
```

### 4. Preview Production Build
Hosts the production `dist/` directory on port `3002`:
```bash
npm run preview
```

---

## 💎 Premium Design & Optimization Features

* **Authoritative Translation Control:** Unified [`TranslinkLanguageController`](file:///c:/Users/Abebaw/Desktop/TRANSLINK_CMS/TRANSLINK_WEB/src/translink/controllers/TranslinkLanguageController.ts) supports instantaneous toggling between English and Amharic languages using tailored Google Noto Sans Ethiopic and Cairo font pairings.
* **SVG Path Tangent Vehicle Navigation:** Pulse-glow indicators move smoothly along regional telemetry coordinates with continuous auto-tangential steering.
* **Deterministic Chunk Graph Splitting:** High-memory packages (Three.js Core, GSAP/Lenis, and Vector/Flubber pipelines) are compiled into dedicated, cacheable vendor chunks.
