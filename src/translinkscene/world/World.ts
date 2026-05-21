/**
 * World
 *
 * Integrates Three.js 3D scene as a fixed background layer.
 * Syncs mesh visibility and background colors with the existing scroll system.
 *
 * Architecture:
 * - Fixed canvas at z-index: 1 (behind 2D content)
 * - Mesh visibility controlled by scroll progress
 * - Background color synced with BackgroundController colors
 * - CSS3D overlay system for info cards connected to 3D reference points
 *
 * Model: sensor_assembly_meshopt.glb & truck_assembly_meshopt.glb
 */

import * as THREE from 'three';
import { ScrollTrigger } from '@/translinkscene/core/gsap';
import { CAMERA_CONFIG, RENDERER_CONFIG } from '../../translinkconfig/paths';
import cameraConfigData from '../../translinkconfig/camera_config.json';
import { setupLighting } from '../core/lights';
import { createBaseScene } from '../core/scene';
import { loadHDREnvironment } from './environment';
import { createModelLoader, loadModel } from './loaders';
import { applyMaterials } from './materials';
import { AdaptiveLightingController } from './AdaptiveLightingController';
// PostProcessingController import removed — no active effects, raw renderer.render() used directly.
// FLOW_CONFIG import removed — was only used by the now-deleted COLORS object.
import { RoadSystem } from '../systems/roadSystem';
import { TruckAudioSystem } from '../systems/truckAudioSystem';
import { AmbientSoundscape } from '../systems/audioSystem';
import { UIOverlay } from '../../translinkbridge/UIOverlay';
import {
    deviceOptimization,
    getResponsiveFOV,
    getAspectCompensation,
} from '../systems/responsiveSystem';
import { MeshBehaviorController } from './MeshBehaviorController';
// S8 Terrain removed - no longer needed

// --------------------------------------------------------------------------------------------------
// MESH CONFIGURATION
// --------------------------------------------------------------------------------------------------

// All Fuel Level Sensor Component meshes (shown as one group)
const FUEL_SENSOR_MESHES = [
    'Fuel_Head',
    'Fuel_Head_cover',
    'Harness',
    'Filter',
    'Filter_Wireframe',
    'Bolt_01',
    'Bolt_02',
    'Bolt_03',
    'Bolt_04',
    'Base',
    'Prob',
    'Logo_Translink_pro',
    'Text_Translink_pro',
];

// Truck model meshes (from truck_assembly_meshopt.glb)
const TRUCK_MESHES = [
    'Truck',
    'Truck_Lights',
    'LOGO',
    'Cab_Glass',
    'Cab_door',
    'Cab_door_glass',
    'Cab_Door_glass_frame',
    'axle001_Front_wheel_Left',
    'axle001_Front_wheel_Right',
    'axle002_wheel_Both_Left_Right',
    'axle003_wheel_Both_Left_Right',
];

// --------------------------------------------------------------------------------------------------
// REFERENCE POINTS - Camera Targets (from Home_objects.md)
// --------------------------------------------------------------------------------------------------

const REF_POINTS = {
    Fuel_Head: { x: -0.2382, y: 0.923, z: 0.0987 }, // Fuel_Head_Ref_Point_003
    Harness: { x: -0.0082, y: 0.9229, z: 0.035 }, // Harness_Ref_Point_01
    Prob: { x: -0.2272, y: 0.531, z: 0.0636 }, // Prob_Ref_Point_005
    Filter: { x: -0.26, y: 0.2629, z: 0.0713 }, // Filter_Ref_Point_006
    Bolt: { x: -0.3167, y: 1.042, z: -0.02 }, // Bolt_Ref_Point_002
    Base: { x: -0.3128, y: 0.708, z: 0.0906 }, // Base_Ref_Point_004
    Center: { x: -0.2, y: 0.6, z: 0 }, // Overall center
    // Full sensor group center (Y spans 0.2263 to 1.0257, center ~0.626)
    SensorGroupCenter: { x: -0.22, y: 0.626, z: 0.035 },
    // S8 Contact section - lower Y value pushes model to TOP of viewport
    S8Footer: { x: -0.22, y: 0.35, z: 0.035 },
    // Hero view target - offset to align with SVG logo circle center (8vh + ~15vw from top)
    HeroLogoCenter: { x: -0.2382, y: 0.923, z: 0.0987 },
    // S4-1 Truck target - aligned with existing Fuel_tank position
    // Truck positioned at: [0.3617, -0.2568, -1.0247]
    TruckCenter: { x: 0.36, y: -0.26, z: -1.02 },
    // S4-1a2: Behind fuel tank camera target
    // Fuel tank on LEFT side of truck (axle001_Front_wheel_Left = -Z side)
    // Camera behind truck (-X from truck), left offset (-Z), outside road (Z < -1.6)
    // Looking toward front (+X driving direction)
    FuelTankRear: { x: -0.2, y: -0.1, z: -1.8 },
};

// --------------------------------------------------------------------------------------------------
// CAMERA KEYFRAMES - Cinematic Continuous Timeline (0% - 100%)
// --------------------------------------------------------------------------------------------------
//
// DESIGN PHILOSOPHY:
// - Floating, weightless camera motion (no mechanical snapping)
// - Cinematic pacing with breath moments between sections
// - Smooth orbital arcs with controlled depth changes
// - Seamless continuity - each keyframe flows into the next
//
// EASING STRATEGY:
// - Quintic ease-in-out for primary interpolation
// - Additional state lerping (0.08) for silky smoothness
// - Catmull-Rom splines for C1 velocity continuity
// --------------------------------------------------------------------------------------------------

interface CameraKeyframe {
    scroll: number;
    distance: number;
    angleY: number;
    angleX: number;
    target: { x: number; y: number; z: number };
    // Optional easing hint for this segment (used by interpolator)
    ease?: 'gentle' | 'dramatic' | 'hold';
}

// CAMERA_KEYFRAMES now loaded dynamically from /assets/config/camera_config.json

// Background color (cream) is set once directly in initScene() — no runtime COLORS object needed.

export class World {
    private container: HTMLElement | null = null;
    private scene: THREE.Scene | null = null;
    private camera: THREE.PerspectiveCamera | null = null;
    private renderer: THREE.WebGLRenderer | null = null;
    private model: THREE.Group | null = null;

    // Dynamic camera configuration
    private cameraKeyframesDesktop: CameraKeyframe[] = [];
    private cameraKeyframesTablet: CameraKeyframe[] = [];
    private cameraKeyframesMobile: CameraKeyframe[] = [];

    // Truck meshes are now part of the main model (truck_assembly_meshopt.glb)
    private truckMeshGroup: THREE.Group | null = null;
    // Front wheel pivots for rotation (created at wheel centers)
    private frontWheelPivots: THREE.Group[] = [];

    private meshCache: Map<string, THREE.Mesh> = new Map();
    private animationId: number | null = null;
    private currentProgress: number = 0;
    // currentColor removed — background is set once in initScene() and never changes.

    // PERFORMANCE: cached DOM refs
    /** Cached reference to <html> for one-time dataset.theme write in initScene() */
    private readonly rootEl: HTMLElement = document.documentElement;
    /** Pre-built list of bolt meshes (populated in cacheMeshes, avoids per-frame forEach) */
    private boltMeshCache: THREE.Mesh[] = [];
    private truckMeshesCache: THREE.Mesh[] = [];
    private fuelSensorMeshesCache: THREE.Mesh[] = [];

    // Waypoint overlay controller completely removed. Using CSS2D auto-labeling.

    // CSS2D auto-labeling system (replaces manual projection)
    private css2dLabels: UIOverlay | null = null;

    // S4-1 Truck Animation Systems (migrated from semi-TRUCK)
    private roadSystem: RoadSystem | null = null;
    private truckAudio: TruckAudioSystem | null = null;
    private ambientSoundscape: AmbientSoundscape | null = null;
    private adaptiveLighting: AdaptiveLightingController | null = null;
    // PostProcessingController removed: EffectComposer with no active effects adds
    // framebuffer ping-pong overhead (~1.8× cost) with zero visual benefit.
    private lastFrameTime: number = 0;
    private lastCameraDistance: number = 0;

    // PERFORMANCE: Demand-based rendering — tracks consecutive idle frames to stop the GPU loop.
    /** Counts consecutive frames where scroll is idle and no continuous animation is running.
     *  Once it reaches CAMERA_SETTLE_FRAMES the animate() loop skips rendering entirely. */
    private cameraSettledFrames: number = 0;
    private static readonly CAMERA_SETTLE_FRAMES = 4;

    // Truck edge lines for fade-in effect (EdgesGeometry)
    private truckEdgeLines: Map<string, THREE.LineSegments> = new Map();

    // Viewport dimensions for responsive centering
    private viewportWidth: number = window.innerWidth;
    private viewportHeight: number = window.innerHeight;
    private aspectRatio: number = window.innerWidth / window.innerHeight;

    private meshBehavior: MeshBehaviorController = new MeshBehaviorController();

    // Smooth camera state (interpolated values)
    private cameraState = {
        distance: 0.45,
        angleY: Math.PI * 1.5,
        angleX: Math.PI * 0.5,
        targetX: REF_POINTS.Fuel_Head.x,
        targetY: REF_POINTS.Fuel_Head.y,
        targetZ: REF_POINTS.Fuel_Head.z,
    };

    constructor() {}

    /**
     * Initialize the 3D scene
     */
    async setup(onProgress?: (percent: number) => void): Promise<void> {
        // Load camera configuration (static import — no async I/O)
        this.loadCameraConfig();

        // Create canvas container
        this.createContainer();

        // Initialize Three.js
        this.initScene();
        this.initCamera();
        this.initRenderer();

        // Setup lighting and environment
        if (this.scene && this.renderer && this.camera) {
            const rig = setupLighting(this.scene, this.camera);

            // Initialize Adaptive Lighting Controller (Phase 2)
            this.adaptiveLighting = new AdaptiveLightingController({
                ambient: rig.ambient,
                rim: rig.backLight,
                key: rig.keyLight,
            });

            await loadHDREnvironment(this.renderer, this.scene, {
                hdrPath: './textures/hdr/studio_small_09_1k.hdr',
            });

            (this.scene as any).environmentIntensity = 0.6;

            // S8 terrain removed - no longer needed
        }

        // Load model (single merged GLB with all assets)
        await this.loadModel(onProgress);

        // Initialize CSS2D auto-labeling system
        if (this.scene && this.model) {
            this.css2dLabels = new UIOverlay();
            this.css2dLabels.loadWaypointConfig();
            this.css2dLabels.discoverAndBuild(this.model, this.scene);
            this.css2dLabels.mount();
        }

        // Setup truck mesh group from loaded model
        this.setupTruckMeshGroup();

        // Setup scroll sync
        this.setupScrollSync();

        // Setup realtime config bridge (HMR)
        this.setupConfigBridge();

        // Initialize S4-1 Truck Animation Systems
        if (this.camera && this.scene) {
            this.roadSystem = new RoadSystem(this.scene);
            this.roadSystem.init();
            this.truckAudio = TruckAudioSystem.getInstance();
            this.truckAudio.init();
            this.ambientSoundscape = AmbientSoundscape.getInstance();
            this.ambientSoundscape.init();
        }

        // Start render loop
        this.animate();
    }

    /**
     * Load camera configuration from JSON
     */
    private loadCameraConfig(): void {
        const data = cameraConfigData as {
            cameraKeyframesDesktop: CameraKeyframe[];
            cameraKeyframesTablet?: CameraKeyframe[];
            cameraKeyframesMobile?: CameraKeyframe[];
        };

        this.cameraKeyframesDesktop = data.cameraKeyframesDesktop || [];
        this.cameraKeyframesTablet = data.cameraKeyframesTablet || [];
        this.cameraKeyframesMobile = data.cameraKeyframesMobile || [];
    }

    /**
     * Get the active keyframe set based on current device
     */
    private getActiveKeyframes(): CameraKeyframe[] {
        if (deviceOptimization.isMobile() && this.cameraKeyframesMobile.length > 0) {
            return this.cameraKeyframesMobile;
        }
        if (deviceOptimization.isTablet() && this.cameraKeyframesTablet.length > 0) {
            return this.cameraKeyframesTablet;
        }
        return this.cameraKeyframesDesktop;
    }

    /**
     * Setup truck mesh group from merged GLB meshes
     * Creates pivots for front wheels at their world centers
     * Creates edge lines for fade-in effect
     */
    private setupTruckMeshGroup(): void {
        if (!this.model) return;

        this.truckMeshGroup = new THREE.Group();
        this.truckMeshGroup.name = 'TruckMeshGroup';
        this.frontWheelPivots = [];
        this.truckEdgeLines.clear();

        // Hide all truck meshes initially (visibility driven by scroll logic)
        TRUCK_MESHES.forEach((meshName) => {
            const mesh = this.meshCache.get(meshName);
            if (mesh) {
                mesh.visible = false;
                // Material and shadow properties are now handled centrally via applyMaterials()
                // in loadModel() using mesh_material_config.json.

                // Create edge lines for non-glass meshes
                const isGlass = meshName.toLowerCase().includes('glass');

                if (!isGlass) {
                    const threshold = this.meshBehavior.getThreshold(meshName);
                    const edges = new THREE.EdgesGeometry(mesh.geometry, threshold);

                    const lineMat = new THREE.LineBasicMaterial({
                        color: new THREE.Color('#29292a'),
                        transparent: true,
                        opacity: 0,
                        depthWrite: false,
                        depthTest: true,
                    });
                    const lineSegments = new THREE.LineSegments(edges, lineMat);
                    lineSegments.visible = false;
                    lineSegments.renderOrder = 2; // Render after solid meshes

                    // Copy transform from mesh
                    lineSegments.position.copy(mesh.position);
                    lineSegments.rotation.copy(mesh.rotation);
                    lineSegments.scale.copy(mesh.scale);

                    // Add to same parent as mesh
                    if (mesh.parent) {
                        mesh.parent.add(lineSegments);
                    } else if (this.scene) {
                        this.scene.add(lineSegments);
                    }

                    this.truckEdgeLines.set(meshName, lineSegments);
                }
            }
        });

        // Create pivots for front wheels and front rear axles only
        const wheelNames = [
            'axle001_Front_wheel_Left',
            'axle001_Front_wheel_Right',
            'axle002_wheel_Both_Left_Right',
            'axle003_wheel_Both_Left_Right',
        ];

        wheelNames.forEach((wheelName) => {
            const mesh = this.meshCache.get(wheelName);
            if (!mesh) return;

            // Get the wheel's world center using bounding box
            const box = new THREE.Box3().setFromObject(mesh);
            const worldCenter = new THREE.Vector3();
            box.getCenter(worldCenter);

            // Create pivot group at world center
            const pivot = new THREE.Group();
            pivot.name = `${wheelName}_pivot`;
            pivot.position.copy(worldCenter);

            // Get mesh's current world position and quaternion
            const meshWorldPos = new THREE.Vector3();
            const meshWorldQuat = new THREE.Quaternion();
            const meshWorldScale = new THREE.Vector3();
            mesh.getWorldPosition(meshWorldPos);
            mesh.getWorldQuaternion(meshWorldQuat);
            mesh.getWorldScale(meshWorldScale);

            // Store original parent
            const originalParent = mesh.parent;
            if (originalParent) {
                // Remove from original parent
                originalParent.remove(mesh);

                // Set mesh position relative to pivot (offset from world center)
                mesh.position.copy(meshWorldPos).sub(worldCenter);
                mesh.quaternion.copy(meshWorldQuat);
                mesh.scale.copy(meshWorldScale);

                // Add mesh to pivot
                pivot.add(mesh);

                // Move edge lines to pivot too
                const edgeLine = this.truckEdgeLines.get(wheelName);
                if (edgeLine && edgeLine.parent) {
                    edgeLine.parent.remove(edgeLine);
                    edgeLine.position.copy(mesh.position);
                    edgeLine.rotation.copy(mesh.rotation);
                    edgeLine.scale.copy(mesh.scale);
                    pivot.add(edgeLine);
                }

                // Add pivot to scene root
                if (this.scene) {
                    this.scene.add(pivot);
                }

                this.frontWheelPivots.push(pivot);
            }
        });
    }

    /**
     * Create fixed canvas container
     */
    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.id = 'scene3d-container';
        this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: var(--z-scene-3d);
      pointer-events: none;
    `;
        document.body.insertBefore(this.container, document.body.firstChild);
    }

    /**
     * Initialize scene
     */
    private initScene(): void {
        this.scene = createBaseScene();
        // Background and theme set once — never touched again per-frame (Phase 1 optimisation)
        this.scene.background = new THREE.Color(0xf5f1e8);
        this.rootEl.dataset.theme = 'light';
    }

    /**
     * Initialize camera with responsive FOV
     */
    private initCamera(): void {
        const aspect = window.innerWidth / window.innerHeight;
        const responsiveFOV = this.calculateResponsiveFOV(CAMERA_CONFIG.fov, aspect);

        this.camera = new THREE.PerspectiveCamera(
            responsiveFOV,
            aspect,
            CAMERA_CONFIG.near,
            CAMERA_CONFIG.far
        );
        this.camera.position.set(...CAMERA_CONFIG.initialPosition);
    }

    /**
     * Calculate responsive FOV - delegates to centralized responsiveSystem.
     * Single source of truth: responsiveSystem.ts::getResponsiveFOV()
     */
    private calculateResponsiveFOV(baseFOV: number, aspect: number): number {
        return getResponsiveFOV(baseFOV, aspect);
    }

    /**
     * Initialize renderer
     */
    private initRenderer(): void {
        if (!this.container) return;

        this.renderer = new THREE.WebGLRenderer({
            antialias: RENDERER_CONFIG.antialias,
            powerPreference: RENDERER_CONFIG.powerPreference,
            alpha: false, // Opaque canvas using scene.background
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, RENDERER_CONFIG.pixelRatioMax)
        );
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows, compatible with ShadowMaterial

        this.container.appendChild(this.renderer.domElement);

        // Handle resize — use boundOnResize to allow proper cleanup in destroy()
        window.addEventListener('resize', this.boundOnResize);
    }

    /**
     * Load 3D model
     */
    private async loadModel(onProgress?: (percent: number) => void): Promise<void> {
        try {
            const loader = createModelLoader();
            this.model = await loadModel(loader, { onProgress });

            // Apply materials (utility uses internal hardcoded config)
            applyMaterials(this.model);

            // Apply mesh behavior overrides (central control)
            this.meshBehavior.applyConfig(this.model);

            if (this.scene) {
                this.scene.add(this.model);
            }

            this.cacheMeshes();
            this.initializeMeshVisibility();
        } catch (error) {
            console.error('[World] Model load failed:', error);
        }
    }

    /**
     * Cache mesh references and populate specific sub-caches
     */
    private cacheMeshes(): void {
        if (!this.model) return;

        this.model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                this.meshCache.set(child.name, child as THREE.Mesh);
            }
        });

        // Pre-build mesh lists for performance
        this.boltMeshCache = [];
        this.truckMeshesCache = [];
        this.fuelSensorMeshesCache = [];

        this.meshCache.forEach((mesh, name) => {
            if (name.toLowerCase().includes('bolt')) {
                this.boltMeshCache.push(mesh);
            }
            if (TRUCK_MESHES.includes(name)) {
                this.truckMeshesCache.push(mesh);
            }
            if (FUEL_SENSOR_MESHES.includes(name)) {
                this.fuelSensorMeshesCache.push(mesh);
            }
        });
    }

    /**
     * Initialize mesh visibility (hide environment, show sensor group except bolts)
     */
    private initializeMeshVisibility(): void {
        this.meshCache.forEach((mesh, name) => {
            // Visibility is now AUTHORITATIVELY controlled via mesh_behavior_config.json.
            const configVisibility = this.meshBehavior.getOverriddenVisibility(name);
            if (configVisibility !== undefined && configVisibility !== null) {
                mesh.visible = configVisibility;
                return;
            }

            // Fallback for meshes not defined in JSON
            const isBoltMesh = name.startsWith('Bolt_') && /Bolt_0[1-4]$/.test(name);
            if (FUEL_SENSOR_MESHES.includes(name)) {
                mesh.visible = !isBoltMesh;
            }
        });
    }

    /**
     * Setup realtime configuration bridge (Vite HMR)
     * Allows live updates to mesh_behavior_config.json without page reload
     */
    private setupConfigBridge(): void {
        if (import.meta.hot) {
            // Mesh Behavior Bridge
            import.meta.hot.accept(
                '../../translinkconfig/mesh_behavior_config.json',
                (module: any) => {
                    if (module && this.model) {
                        console.log('[World] Mesh behavior config updated (Realtime Bridge)');
                        this.meshBehavior.updateConfig(module.default);
                        this.meshBehavior.applyConfig(this.model);
                    }
                }
            );
        }
    }

    /**
     * Setup scroll synchronization with Lenis/ScrollTrigger
     */
    private setupScrollSync(): void {
        ScrollTrigger.create({
            trigger: '#flow-content',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self: any) => {
                this.currentProgress = self.progress;
            },
        });
    }

    /**
     * Animation loop — demand-based rendering.
     *
     * PERFORMANCE STRATEGY:
     * - Only updates scene logic and renders when something has actually changed.
     * - Scroll-idle + camera-settled = skip all logic AND skip the render call.
     * - Wheel rotation (truck section) is the only continuous-update exception.
     * - Direct renderer.render() replaces EffectComposer (no active effects).
     */
    private animate = (): void => {
        this.animationId = requestAnimationFrame(this.animate);

        const currentTime = performance.now();
        const delta = this.lastFrameTime
            ? Math.min((currentTime - this.lastFrameTime) / 1000, 0.1)
            : 0.016;
        this.lastFrameTime = currentTime;

        const p = this.currentProgress;
        const scrollChanged = Math.abs(p - this.lastProgress) > 0.0004;

        // Wheel rotation is the only time-based animation — only active in truck window
        const hasWheelRotation = p >= 0.51 && p <= 0.71 && this.frontWheelPivots.length > 0;

        // ── Early exit: nothing to update ────────────────────────────────────
        if (!scrollChanged && !hasWheelRotation) {
            // Camera may still be lerping toward its target even when scroll is idle.
            // Allow a few more frames to let it settle, then truly stop rendering.
            if (this.cameraSettledFrames >= World.CAMERA_SETTLE_FRAMES) {
                return; // Scene is fully static — skip GPU entirely
            }

            // Camera still lerping — render one more frame to let it converge
            this.updateCamera(p);
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
                if (this.css2dLabels) this.css2dLabels.render(this.scene, this.camera);
            }
            this.cameraSettledFrames++;
            return;
        }

        // ── Scene is active — run full update pipeline ────────────────────────
        this.cameraSettledFrames = 0; // reset settle counter on any activity
        this.lastProgress = p;

        // Update camera position
        this.updateCamera(p);

        // WaypointOverlayController removed. We now strictly use css2dLabels.
        if (this.css2dLabels) {
            this.css2dLabels.update(p);
        }

        // Note: updateBackgroundColor removed from per-frame loop.
        // Background is set once to 0xf5f1e8 in initScene() and never changes.
        // rootEl.dataset.theme is also set once here to avoid per-frame DOM writes.

        // Update Visibility Systems (Batch processed)
        this.updateVisibilityBatches(p, delta);

        // Update Road and Particle systems (Always active 0-100% scroll range)
        if (this.roadSystem) {
            this.updateS4_1bRoadParticles(p, delta);
        }

        // Spin wheel pivots (only when driving)
        if (hasWheelRotation) {
            this.frontWheelPivots.forEach((pivot) => (pivot.rotation.z -= 3.0 * delta));
        }

        // Update S4-1b Audio
        this.updateS4_1bAudio(p);

        // Update ambient soundscape
        if (this.ambientSoundscape) {
            this.updateAmbientSoundscape(p);
        }

        // Update Adaptive Lighting
        if (this.adaptiveLighting) {
            this.adaptiveLighting.update(p);
        }

        // Render — direct renderer.render(), no EffectComposer overhead
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            if (this.css2dLabels) {
                this.css2dLabels.render(this.scene, this.camera);
            }
        }
    };

    private static readonly S4_1A_START = 0.4;
    private static readonly S4_1A_END = 0.45;

    private cachedLogoContainer: HTMLElement | null = null;
    private cachedLogoSvg: HTMLElement | null = null;
    private lastTruckVisibilityState: string = '';
    private lastLogoOpacity: number = -1;
    private lastMeshOpacity: Map<string, number> = new Map();
    private lastProgress: number = -1;

    private updateVisibilityBatches(p: number, delta: number): void {
        this.updateTextLogoVisibility(p);
        this.updateFuelTankVisibility(p);
        this.updateFuelSensorComponentsVisibility(p);
        this.updateS4_1aSensorMounted(p);
        this.updateS7BoltMeshesVisibility(p);
        this.updateTruckVisibility(p, delta);
        this.updateRoadGroundShadow(p);
    }

    private updateRoadGroundShadow(progress: number): void {
        if (!this.roadSystem) return;
        const FADE_IN_END = 0.05;
        const FADE_OUT_START = 0.95;
        const MAX_OPACITY = 0.3;
        let opacity =
            progress < FADE_IN_END
                ? (progress / FADE_IN_END) * MAX_OPACITY
                : progress > FADE_OUT_START
                  ? ((1.0 - progress) / (1.0 - FADE_OUT_START)) * MAX_OPACITY
                  : MAX_OPACITY;
        this.roadSystem.setGroundPlaneOpacity(opacity);
    }

    private ensureDOMCache(): void {
        if (!this.cachedLogoContainer)
            this.cachedLogoContainer = document.getElementById('hero-logo-container');
        if (!this.cachedLogoSvg) this.cachedLogoSvg = document.getElementById('hero-logo');
    }

    private updateFuelTankVisibility(progress: number): void {
        const FUEL_TANK_START = 0.0,
            FULL_END = 0.56,
            TRANS_END = 0.7,
            RANGE = 0.02;
        const inFull = progress >= FUEL_TANK_START && progress <= FULL_END;
        const inTrans = progress > FULL_END && progress <= TRANS_END;

        // PERFORMANCE: Filtered cache or direct refs used to avoid per-frame search
        ['Fuel_tank', 'Belt'].forEach((name) => {
            const mesh = this.meshCache.get(name);
            if (!mesh) return;
            const configVis = this.meshBehavior.getOverriddenVisibility(mesh.name);
            if (configVis === false) {
                mesh.visible = false;
                return;
            }
            if (!inFull && !inTrans) {
                mesh.visible = false;
                return;
            }
            let opacity = inFull
                ? progress < 0.1
                    ? progress / 0.1
                    : progress > FULL_END - RANGE
                      ? 1.0 - ((progress - (FULL_END - RANGE)) / RANGE) * 0.9
                      : 1.0
                : 0.1;
            mesh.visible = opacity > 0.001;
            if (mesh.visible) this.setMeshOpacity(mesh, Math.max(0, Math.min(1, opacity)));
        });
    }

    private updateS4_1aSensorMounted(progress: number): void {
        if (progress >= World.S4_1A_START && progress <= World.S4_1A_END) {
            this.fuelSensorMeshesCache.forEach((mesh) => {
                const configVis = this.meshBehavior.getOverriddenVisibility(mesh.name);
                mesh.visible = configVis !== undefined && configVis !== null ? configVis : true;
            });
        }
    }

    private updateS4_1bAudio(progress: number): void {
        this.truckAudio?.update(progress);
    }

    private updateS4_1bRoadParticles(_progress: number, delta: number): void {
        // Road is now visible and animated across the entire scroll timeline (0% - 100%)
        if (this.roadSystem) {
            this.roadSystem.setVisible(true);
            this.roadSystem.setOpacity(1.0);
            this.roadSystem.update(delta);
        }
    }

    private updateTruckVisibility(progress: number, _delta: number): void {
        const START = 0.49,
            END = 0.71,
            EDGE_IN = 0.51,
            SOLID = 0.58,
            EDGE_OUT = 0.66;
        const inRange = progress >= START && progress <= END;
        const stateKey = !inRange
            ? 'hidden'
            : progress < EDGE_IN
              ? `eI:${(progress * 100).toFixed(0)}`
              : progress < SOLID
                ? `sF:${(progress * 100).toFixed(0)}`
                : progress < EDGE_OUT
                  ? 'sF'
                  : `eO:${(progress * 100).toFixed(0)}`;

        if (stateKey === this.lastTruckVisibilityState) {
            // Wheel rotation is handled centrally in animate() — do not duplicate here.
            return;
        }
        this.lastTruckVisibilityState = stateKey;

        // PERFORMANCE: Use pre-cached list instead of Map lookups
        this.truckMeshesCache.forEach((mesh) => {
            const name = mesh.name;
            if (!mesh) return;
            const configVis = this.meshBehavior.getOverriddenVisibility(name);
            if (configVis !== undefined && configVis !== null) {
                mesh.visible = configVis;
                if (this.meshBehavior.shouldOverrideAnimation(name)) return;
            }
            const edgeLine = this.truckEdgeLines.get(name),
                isGlass = name.toLowerCase().includes('glass');
            if (!inRange) {
                mesh.visible = false;
                if (edgeLine) edgeLine.visible = false;
                return;
            }

            if (progress < EDGE_IN) {
                mesh.visible = true;
                this.setMeshOpacity(mesh, 0.1);
                if (edgeLine) {
                    edgeLine.visible = true;
                    (edgeLine.material as THREE.LineBasicMaterial).opacity =
                        Math.min(1, (progress - START) / (0.5 - START)) * (0.15 + 0.25 * 0.4);
                }
            } else if (progress < SOLID) {
                const t = (progress - EDGE_IN) / (SOLID - EDGE_IN);
                mesh.visible = true;
                if (edgeLine)
                    (edgeLine.material as THREE.LineBasicMaterial).opacity =
                        (0.15 + 0.25 * 0.4) * (1 - t);
                this.setMeshOpacity(mesh, isGlass ? 0.85 * t : t);
            } else if (progress < EDGE_OUT) {
                mesh.visible = true;
                if (edgeLine) edgeLine.visible = false;
                this.setMeshOpacity(mesh, isGlass ? 0.85 : 1.0);
            } else {
                const t = 1 - (progress - EDGE_OUT) / (END - EDGE_OUT);
                mesh.visible = false;
                if (edgeLine) {
                    edgeLine.visible = true;
                    (edgeLine.material as THREE.LineBasicMaterial).opacity =
                        t * (0.15 + 0.25 * 0.4);
                }
            }
        });
        // Wheel rotation handled centrally in animate() — not here.
    }

    private updateS7BoltMeshesVisibility(progress: number): void {
        const START = 0.8,
            END = 0.87,
            RANGE = 0.02;
        this.boltMeshCache.forEach((mesh) => {
            const inRange = progress >= START && progress <= END;
            if (!inRange) {
                mesh.visible = false;
                return;
            }
            let opacity =
                progress < START + RANGE
                    ? (progress - START) / RANGE
                    : progress > END - RANGE
                      ? (END - progress) / RANGE
                      : 1;
            mesh.visible = true;
            this.setMeshOpacity(mesh, Math.max(0, Math.min(1, opacity)));
        });
    }

    private updateFuelSensorComponentsVisibility(progress: number): void {
        const base = this.meshCache.get('Base');
        if (base)
            base.visible = this.meshBehavior.getOverriddenVisibility('Base') ?? progress < 0.66;
    }

    private updateTextLogoVisibility(progress: number): void {
        this.ensureDOMCache();
        const logoSvg = this.cachedLogoSvg;
        if (logoSvg) {
            const F_START = 0.03,
                F_END = 0.857,
                S7_S = 0.857,
                S7_F = 0.92;
            let target =
                progress <= F_START
                    ? 1
                    : progress < F_END
                      ? 1 - ((progress - F_START) / (F_END - F_START)) * 0.9
                      : 0.1 + Math.min((progress - S7_S) / (S7_F - S7_S), 1) * 0.9;
            if (Math.abs(target - this.lastLogoOpacity) > 0.01) {
                logoSvg.style.opacity = `${target}`;
                this.lastLogoOpacity = target;
            }
        }
        const boltVisible = progress >= 0.3 && progress < 0.857;
        this.boltMeshCache.forEach((m) => (m.visible = boltVisible));
    }

    private setMeshOpacity(mesh: THREE.Mesh, opacity: number): void {
        if (!mesh.material || this.meshBehavior.shouldOverrideAnimation(mesh.name)) return;
        const last = this.lastMeshOpacity.get(mesh.uuid) ?? -1;
        if (Math.abs(opacity - last) < 0.01) return;
        this.lastMeshOpacity.set(mesh.uuid, opacity);

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
            if (
                mat instanceof THREE.MeshStandardMaterial ||
                mat instanceof THREE.MeshPhysicalMaterial
            ) {
                const newTransparent = opacity < 1.0;
                // If the transparency state is changing, Three.js requires a shader/render-list update
                if (mat.transparent !== newTransparent) {
                    mat.transparent = newTransparent;
                    mat.needsUpdate = true;
                }
                mat.opacity = opacity;
            }
        });
    }

    private updateCamera(progress: number): void {
        if (!this.camera) return;
        const interp = this.catmullRomInterpolate(progress);
        const lerpFactor =
            Math.abs(interp.distance - this.cameraState.distance) > 0.5 ? 0.12 : 0.08;
        this.cameraState.distance = this.lerp(
            this.cameraState.distance,
            interp.distance,
            lerpFactor
        );
        this.cameraState.angleY = this.lerpAngle(
            this.cameraState.angleY,
            interp.angleY,
            lerpFactor
        );
        this.cameraState.angleX = this.lerp(this.cameraState.angleX, interp.angleX, lerpFactor);
        this.cameraState.targetX = this.lerp(this.cameraState.targetX, interp.targetX, lerpFactor);
        this.cameraState.targetY = this.lerp(this.cameraState.targetY, interp.targetY, lerpFactor);
        this.cameraState.targetZ = this.lerp(this.cameraState.targetZ, interp.targetZ, lerpFactor);

        const dist = this.cameraState.distance * this.calculateAspectCompensation();
        this.camera.position.set(
            this.cameraState.targetX +
                dist * Math.cos(this.cameraState.angleX) * Math.sin(this.cameraState.angleY),
            this.cameraState.targetY + dist * Math.sin(this.cameraState.angleX),
            this.cameraState.targetZ +
                dist * Math.cos(this.cameraState.angleX) * Math.cos(this.cameraState.angleY)
        );
        this.camera.lookAt(
            this.cameraState.targetX,
            this.cameraState.targetY,
            this.cameraState.targetZ
        );
    }

    private lerpAngle(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    private catmullRomInterpolate(progress: number): any {
        const kf = this.getActiveKeyframes(),
            n = kf.length;
        if (n === 0)
            return { distance: 2, angleY: 0, angleX: 0, targetX: 0, targetY: 0, targetZ: 0 };
        progress = Math.max(0, Math.min(1, progress));
        let i = 0;
        for (let j = 0; j < n - 1; j++) {
            if (progress >= kf[j].scroll && progress <= kf[j + 1].scroll) {
                i = j;
                break;
            }
        }
        if (progress >= kf[n - 1].scroll) i = n - 2;
        const p1 = kf[i],
            p2 = kf[Math.min(n - 1, i + 1)],
            p0 = i === 0 ? kf[n - 2] : kf[Math.max(0, i - 1)],
            p3 = i + 1 >= n - 1 ? kf[1] : kf[Math.min(n - 1, i + 2)];
        const t = p2.scroll - p1.scroll > 0 ? (progress - p1.scroll) / (p2.scroll - p1.scroll) : 0;
        const et = this.getContextualEase(t, p1.ease, p2.ease);
        return {
            distance: this.catmullRom(p0.distance, p1.distance, p2.distance, p3.distance, et),
            angleY: this.catmullRom(p0.angleY, p1.angleY, p2.angleY, p3.angleY, et),
            angleX: this.catmullRom(p0.angleX, p1.angleX, p2.angleX, p3.angleX, et),
            targetX: this.catmullRom(p0.target.x, p1.target.x, p2.target.x, p3.target.x, et),
            targetY: this.catmullRom(p0.target.y, p1.target.y, p2.target.y, p3.target.y, et),
            targetZ: this.catmullRom(p0.target.z, p1.target.z, p2.target.z, p3.target.z, et),
        };
    }

    private getContextualEase(t: number, f?: string, to?: string): number {
        return f === 'hold' || to === 'hold'
            ? -(Math.cos(Math.PI * t) - 1) / 2
            : f === 'dramatic' || to === 'dramatic'
              ? t < 0.5
                  ? 8 * t ** 4
                  : 1 - Math.pow(-2 * t + 2, 4) / 2
              : t < 0.5
                ? 16 * t ** 5
                : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }

    private catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
        const t2 = t * t,
            t3 = t2 * t;
        return (
            0.5 *
            (2 * p1 +
                (-p0 + p2) * t +
                (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
                (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
        );
    }

    private calculateAspectCompensation(): number {
        return getAspectCompensation(this.aspectRatio);
    }

    // updateBackgroundColor removed — background fixed in initScene(), theme set once there too.

    private updateAmbientSoundscape(p: number): void {
        if (!this.ambientSoundscape) return;
        const curD = this.cameraState.distance;
        const vel = Math.abs(curD - this.lastCameraDistance) * 10;
        this.lastCameraDistance = curD;
        const normD = (Math.max(0.34, Math.min(6.0, curD)) - 0.34) / (6.0 - 0.34);
        this.ambientSoundscape.update(p, normD, vel);
    }

    private resizeTimeout: number | null = null;
    private readonly RESIZE_DEBOUNCE_MS = 150;

    private onResize(): void {
        if (!this.camera || !this.renderer) return;
        if (this.resizeTimeout !== null) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = window.setTimeout(() => {
            this.viewportWidth = window.innerWidth;
            this.viewportHeight = window.innerHeight;
            this.aspectRatio = this.viewportWidth / this.viewportHeight;
            this.camera!.aspect = this.aspectRatio;
            this.camera!.fov = this.calculateResponsiveFOV(CAMERA_CONFIG.fov, this.aspectRatio);
            this.camera!.updateProjectionMatrix();
            this.renderer!.setSize(this.viewportWidth, this.viewportHeight);
            this.renderer!.setPixelRatio(
                Math.min(window.devicePixelRatio, RENDERER_CONFIG.pixelRatioMax)
            );
            this.css2dLabels?.resize(this.viewportWidth, this.viewportHeight);
            this.updateCamera(this.currentProgress);
            // postProcessing?.setSize() removed — PostProcessingController was eliminated.
            // Force one render after resize so the new size is displayed immediately.
            this.cameraSettledFrames = 0;
            this.resizeTimeout = null;
        }, this.RESIZE_DEBOUNCE_MS);
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    getCamera(): THREE.PerspectiveCamera | null {
        return this.camera;
    }

    // Bound resize handler stored so it can be properly removed in destroy()
    private readonly boundOnResize = this.onResize.bind(this);

    destroy(): void {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.resizeTimeout !== null) clearTimeout(this.resizeTimeout);
        this.roadSystem?.dispose();
        this.truckAudio?.dispose();
        this.ambientSoundscape?.dispose();
        this.css2dLabels?.destroy();
        this.truckMeshGroup = null;
        this.frontWheelPivots = [];
        window.removeEventListener('resize', this.boundOnResize);
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container?.parentNode) this.container.parentNode.removeChild(this.container);
        }
        this.meshCache.clear();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
    }
}
