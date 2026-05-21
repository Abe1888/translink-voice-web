# Translink Responsive Layout

A strictly isolated, modular UI implementation refactored from the `Translink-responsive-Code.html` wireframe. It functions as an independently structured layout that runs synchronously inside the root app layer, without intruding upon existing CSS scoping, structural paths, or configuration files.

## 🛑 Strict Rule 🛑
> **"No disruptive changes are allowed to the responsive layout. All updates must preserve existing structure, behavior, and visual consistency without breaking the layout flow."**

## 📁 Architecture Overview

This module completely dismantles the original monolithic HTML file into structured native ES logic:

```text
translink/
├── components/                    # Global/Shared component blueprints
│   └── GlobalNavIndicator.ts      # Global responsive 5% navigational node tracker
├── translinkS1/                   # TranslinkS1 Section Namespace
│   ├── components/                # Reusable interface blueprints
│   │   ├── TranslinkS1Footer.ts         # Bottom precision bounding layer
│   │   ├── TranslinkS1MainContent.ts    # Localized wrapper formatting limits
│   │   └── TranslinkS1Sidebar.ts        # 15% isolated tracking display
│   ├── controllers/               # System controllers mapping
│   │   └── TranslinkS1Controller.ts     # Mount initialization controller
│   ├── sections/                  # Assemblers formatting components
│   │   ├── TranslinkS1HeroSection.ts    # Dynamic 3D container & Intel textual logic
│   │   └── TranslinkS1MainLayout.ts     # Root orchestrator container
│   └── styles/                    # Isolated aesthetics ensuring ZERO leakage
│       ├── translinkS1-main.css         # Global injector 
│       ├── translinkS1-utilities.css    # Layout overrides (custom-scrollbars)
│       └── translinkS1-variables.css    # Extracted clamp() typographic fluid rules
├── translinkS2/                   # TranslinkS2 Section Namespace
│   ├── components/                # S2 blueprints
│   │   ├── TranslinkS2Footer.ts         # Precision tracking system footer
│   │   ├── TranslinkS2MainContent.ts    # Central wrapper
│   │   └── TranslinkS2Sidebar.ts        # 15% isolated tracking label (Precision Tracking)
│   ├── controllers/               # System controllers mapping
│   │   └── TranslinkS2Controller.ts     # Mount initialization controller
│   ├── sections/                  # Assemblers formatting components
│   │   ├── TranslinkS2ContentSection.ts # Secondary placeholder/analytics layout
│   │   └── TranslinkS2MainLayout.ts     # Root layout orchestration hooking into 5% gutter padding
│   └── styles/                    # Isolated localized S2 aesthetics
│       ├── translinkS2-main.css
│       ├── translinkS2-utilities.css
│       └── translinkS2-variables.css
├── main.ts                        # Root module entry hooking TranslinkS1Controller to DOM
└── README.md                      # Implementation rules & bounds guide
```
*(The layout relies structurally on `/translink.html` placed at your repository root to execute.)*

## 🚀 Entry Point
To view and test this module safely, navigate directly to your local Vite server targeting the bespoke root file:
```text
http://localhost:<PORT>/translink.html
```

## ⚙️ Development Guidelines
1. **Never Break Form:** Adhere inherently to the horizontal split ratios configured across landscape bounds (`w-[15%]`, `w-[80%]`, `w-[5%]`). 
2. **Never Taint Original Repos:** `index.html` and central system files are permanently off-limits.
3. Every style iteration must pass through the `styles/*.css` tree instead of deploying `<style>` elements into string templates.
