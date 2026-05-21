# TRANSLINK Configuration Library

This directory serves as the **Single Source of Truth** for the application's visual and behavioral configuration. These JSON files drive the 3D scene, UI layout, and animation timings without requiring code changes.

## Configuration Files Overview

### 1. `mesh_material_config.json`
**Purpose**: Defines the physical appearance of every 3D mesh in the scene.
- **Keys**: Mapped to mesh names in the GLB assets (e.g., `truckBody`, `fuelHead`).
- **Properties**:
    - `color`: Hex string (e.g., `"#bc0c0c"`).
    - `metalness`: 0.0 to 1.0 (shiny vs matte).
    - `roughness`: 0.0 to 1.0 (smooth vs textured).
    - `envMapIntensity`: Controls HDR reflection strength.
    - `clearcoat`: Adds a glossy "car paint" layer on top.
    - `transmission`: 0.0 to 1.0 (glass transparency).
    - `emissive`: Hex string for self-illumination (lights).

### 2. `camera_config.json`
**Purpose**: Manages the cinematic camera path and scene environment settings.
- **Properties**:
    - `keyframes`: Array of camera positions, targets, and FOV values keyed to scroll progress.
    - `fog`: Scene distance fog settings for dark/light mode transitions.
    - `lighting`: Global light intensities (Ambient, Directional).

### 3. `waypoint_config.json`
**Purpose**: Controls the 3D annotation labels (Waypoints) and their connected content.
- **Properties**:
    - `scrollStart` / `scrollEnd`: Visibility window in normalized scroll (0-1).
    - `refPointName`: The 3D locator node in the GLB that the label anchors to.
    - `content`: Title, subtitle, description, and stats list for each popup card.
    - `styling`: Alignment and UI direction overrides.

### 4. `global_ui_config.json`
**Purpose**: Defines parameters for persistent global UI elements.
- **Properties**:
    - `noise`: Opacity and stacking order of the cinematic noise overlay.
    - `cursor`: Custom cursor (dot & ring) IDs and styles.
    - `shards`: Properties for floating parallax background elements.
    - `logo`: Reference IDs for the SVG hero logo.

---

## Workflow for Designers

1. **Colors**: Update hex values in `mesh_material_config.json` to change the brand identity of the truck or sensor.
2. **Animation**: Adjust `scrollStart` values in `waypoint_config.json` to fix overlapping text or timing issues.
3. **Materials**: Tweak `metalness` or `transmission` to achieve the desired balance between realism and UI aesthetics.

> [!IMPORTANT]
> Always ensure JSON syntax is valid. If the app displays a fallback screen or fails to load the 3D model, check the browser console for fetch errors related to these config files.
