

# 📁 **Proposed Project Structure (Translink Scene System)** 

```bash
src/
│
├── translinkscene/
│   │
│   ├── core/
│   │   ├── engine/
│   │   │   ├── SceneManager.ts
│   │   │   ├── Renderer.ts
│   │   │   ├── Camera.ts
│   │   │   ├── ResizeManager.ts
│   │   │   └── Time.ts
│   │   │
│   │   ├── world/
│   │   │   ├── World.ts
│   │   │   ├── Environment.ts
│   │   │   ├── Lighting.ts
│   │   │   └── HDRIManager.ts
│   │   │
│   │   └── bootstrap/
│   │       ├── init.ts
│   │       └── config.ts
│   │
│   ├── objects/
│   │   ├── truck/
│   │   │   ├── TruckModel.ts
│   │   │   ├── TruckAssembly.ts
│   │   │   ├── TruckMaterials.ts
│   │   │   └── TruckAnimations.ts
│   │   │
│   │   ├── environment/
│   │   │   ├── Ground.ts
│   │   │   ├── Props.ts
│   │   │   └── SceneDecor.ts
│   │   │
│   │   └── interactables/
│   │       ├── Waypoints.ts
│   │       └── Hotspots.ts
│   │
│   ├── animation/
│   │   ├── gsap/
│   │   │   ├── ScrollTimeline.ts
│   │   │   ├── CameraTransitions.ts
│   │   │   └── SectionTriggers.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── ScrollController.ts
│   │   │   ├── ParallaxController.ts
│   │   │   └── SequenceController.ts
│   │   │
│   │   └── timelines/
│   │       └── MasterTimeline.ts
│   │
│   ├── postprocessing/
│   │   ├── PostFX.ts
│   │   ├── Bloom.ts
│   │   ├── Vignette.ts
│   │   ├── ColorGrading.ts
│   │   └── Composer.ts
│   │
│   ├── audio/
│   │   ├── AudioSystem.ts
│   │   ├── TruckAudioSystem.ts
│   │   ├── AmbientSoundscape.ts
│   │   └── AudioEvents.ts
│   │
│   ├── ui/
│   │   ├── overlay/
│   │   │   ├── DOMRenderer.ts
│   │   │   ├── LabelSystem.ts
│   │   │   └── UIBridge.ts
│   │   │
│   │   ├── components/
│   │   │   ├── LiveFeedButton.ts
│   │   │   ├── TranslinkLiveFeed.ts
│   │   │   ├── TelemetryCard.ts
│   │   │   └── BrandVertical.ts
│   │   │
│   │   └── styles/
│   │       ├── global.css
│   │       └── theme.css
│   │
│   ├── shaders/
│   │   ├── vertex/
│   │   ├── fragment/
│   │   └── materials/
│   │
│   ├── loaders/
│   │   ├── GLTFLoader.ts
│   │   ├── TextureLoader.ts
│   │   └── HDRLoader.ts
│   │
│   ├── utils/
│   │   ├── math/
│   │   ├── debug/
│   │   ├── performance/
│   │   └── helpers.ts
│   │
│   ├── constants/
│   │   ├── scene.ts
│   │   ├── animation.ts
│   │   └── config.ts
│   │
│   └── index.ts
│
├── translink/
│   ├── UI system (DOM / overlays / layout / CSS)
│   ├── dashboards
│   ├── cards
│   └── interactions
│
└── assets/
    ├── models/
    ├── textures/
    ├── hdr/
    ├── audio/
    └── fonts/
```

---



 📁 **Proposed Project Structure (Translink Full)** 

src/
│
├── translinkscene/                      # 🎬 3D ENGINE LAYER (Three.js Core)
│   │
│   ├── core/                            # Engine foundation
│   │   ├── engine/                      # Renderer, Scene, Camera, Resize
│   │   ├── world/                       # Environment + lighting system
│   │   ├── bootstrap/                   # App initialization + config loader
│   │
│   ├── objects/                        # 3D World Assets
│   │   ├── truck/                       # Main hero model system
│   │   ├── environment/                 # Ground, props, scene decor
│   │   ├── interactables/               # 3D hotspots / waypoints
│   │
│   ├── animation/                      # Motion system (GSAP control layer)
│   │   ├── controllers/                 # Scroll + parallax logic
│   │   ├── gsap/                        # Timeline definitions
│   │   ├── timelines/                   # Master animation sequencing
│   │
│   ├── postprocessing/                 # Visual FX pipeline
│   │   ├── bloom/
│   │   ├── vignette/
│   │   ├── colorgrading/
│   │   └── composer/
│   │
│   ├── audio/                          # 3D sound system
│   │   ├── TruckAudioSystem.ts
│   │   ├── AmbientSoundscape.ts
│   │   └── AudioEvents.ts
│   │
│   ├── shaders/                        # GLSL materials
│   │
│   ├── loaders/                        # GLTF / HDR / textures
│   │
│   ├── utils/                          # Math, helpers, debug tools
│   │
│   └── index.ts                        # Scene entry point
│
├── translinkconfig/                        #cofigs 
│
├── translinkbridge/                     # 🌉 COMMUNICATION LAYER (The Bridge)
│   ├── SceneBridge.ts                  # Main 3D-to-UI communication
│   ├── UIOverlay.ts                    # 3D Label Positioning (CSS2DRenderer)
│   ├── Waypoint.ts                     # 3D-to-UI Hotspot logic
│   └── EventBus.ts                     # (Planned) Global event handling
│
├── translink/                           # 🧠 UI & INTERACTION LAYER (DOM System)
│   │
│   ├── core/
│   │   ├── UIManager.ts                # Global UI controller
│   │   ├── UIBridge.ts                 # Bridge to 3D scene events
│   │   ├── EventBus.ts                 # Communication layer
│   │
│   ├── components/                     # UI Modules
│   │   ├── LiveFeedButton.ts
│   │   ├── TranslinkLiveFeed.ts
│   │   ├── TelemetryCard.ts
│   │   ├── BrandVertical.ts
│   │
│   ├── layout/                         # Structural UI sections
│   │   ├── Header.ts
│   │   ├── Sidebar.ts
│   │   ├── Footer.ts
│   │
│   ├── animation/                      # UI GSAP animations
│   │   ├── reveal.ts
│   │   ├── scroll.ts
│   │   ├── transitions.ts
│   │
│   ├── styles/                         # Global styling system
│   │   ├── global.css
│   │   ├── theme.css
│   │
│   ├── utils/                          # DOM helpers + utilities
│   │
│   └── index.ts                        # UI bootstrap entry
│
│
├── assets/                              # Shared assets
│   ├── models/
│   ├── textures/
│   ├── hdr/
│   ├── audio/
│   └── fonts/
│
│
└── shared/                              # 🔗 Shared communication layer
    ├── constants/
    ├── types/
    ├── config/
    └── eventTypes.ts




    # 🧠 **Architecture Principles (IMPORTANT)**

### 1. Strict Separation

* `translinkscene` → ONLY 3D engine (Three.js, GSAP, shaders, physics, audio hooks)
* `translink` → ONLY UI / DOM / CSS / overlays

---

### 2. No Mixing Rule

* ❌ No HTML/CSS inside `translinkscene`
* ❌ No Three.js inside `translink`
* ✔ Communication only via `UIBridge.ts`

---