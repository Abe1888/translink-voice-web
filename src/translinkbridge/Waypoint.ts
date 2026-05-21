/**
 * Waypoint Overlay Controller for Index Page
 *
 * Implements vision.html-style waypoint overlays for the index page.
 * Tracks 3D reference points and displays animated DOM overlays.
 */

import * as THREE from 'three';
import { gsap } from '@/translinkscene/core/gsap';

// --------------------------------------------------------------------------------------------------
// COLOR MANAGEMENT - Progress-based color selection
// --------------------------------------------------------------------------------------------------

const OVERLAY_COLORS = {
    titleColor: '#161616',
    subtitleColor: 'rgba(22, 22, 22, 0.7)',
    descColor: 'rgba(22, 22, 22, 0.95)',
    statsColor: '#161616',
    dividerColor: 'rgba(22, 22, 22, 0.3)',
    dotColor: '#161616',
    dotShadow: 'rgba(22, 22, 22, 0.2)',
    ringColor: 'rgba(22, 22, 22, 0.2)',
    pathStroke: 'rgba(22, 22, 22, 0.5)',
};

// --------------------------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------------------------

export interface WaypointOverlayData {
    overlay: HTMLElement;
    pulse: HTMLElement | null;
    svg: SVGSVGElement | null;
    path: SVGPathElement | null;
    endpoint: SVGCircleElement | null;
    card: HTMLElement | null;
    title: HTMLElement | null;
    subtitle: HTMLElement | null;
    desc: HTMLElement | null;
    stats: HTMLElement[];
    divider: HTMLElement | null;
    isVisible: boolean;
    isAnimating: boolean;
    screenX: number;
    screenY: number;
    dirX: number; // Locked horizontal direction
    dirY: number; // Locked vertical direction
    initialDirX: number | null; // Store initial direction for consistency
    initialDirY: number | null; // Store initial direction for consistency
    lastColorProgress: number; // Track last color update progress
    pathLength?: number; // Cached SVG path length to prevent layout thrash
}

interface ScreenPos {
    x: number;
    y: number;
    visible: boolean;
    scale: number;
}

// --------------------------------------------------------------------------------------------------
// WAYPOINT CONFIGURATION
// --------------------------------------------------------------------------------------------------

export interface WaypointConfig {
    id: string;
    refPointName: string;
    position: THREE.Vector3;
    scrollStart: number;
    scrollEnd: number;
    title: string;
    subtitle: string;
    description: string;
    stats: string[];
    image?: string;
    forceDirection?: 'left' | 'right'; // Force overlay to specific side
}

/**
 * Raw JSON shape from /assets/config/waypoint_config.json
 */
interface WaypointConfigJSON {
    id: string;
    refPointName: string;
    position: { x: number; y: number; z: number };
    scrollStart: number;
    scrollEnd: number;
    content: {
        title: string;
        subtitle: string;
        description: string;
        image?: string;
        stats: string[];
    };
    styling?: {
        forceDirection?: 'left' | 'right';
    };
}

/**
 * Convert raw JSON waypoint to runtime WaypointConfig
 */
function mapJSONToConfig(raw: WaypointConfigJSON): WaypointConfig {
    return {
        id: raw.id,
        refPointName: raw.refPointName,
        position: new THREE.Vector3(raw.position.x, raw.position.y, raw.position.z),
        scrollStart: raw.scrollStart,
        scrollEnd: raw.scrollEnd,
        title: raw.content.title,
        subtitle: raw.content.subtitle,
        description: raw.content.description,
        stats: raw.content.stats,
        image: raw.content.image,
        forceDirection: raw.styling?.forceDirection,
    };
}

/**
 * Fallback waypoint configs (used if JSON fetch fails)
 * Kept in sync with /assets/config/waypoint_config.json
 */
const FALLBACK_WAYPOINT_CONFIGS: WaypointConfig[] = [
    {
        id: 'fuel-head',
        refPointName: 'Fuel_Head_Ref_Point_003',
        position: new THREE.Vector3(-0.2382, 0.923, 0.0987),
        scrollStart: 0.16,
        scrollEnd: 0.19,
        title: 'SENSOR HEAD',
        subtitle: 'PRECISION TRACKING',
        description:
            'Military-grade GNSS tracking with sub-meter accuracy. 24/7 visibility and geofencing.',
        stats: ['SUB-METER', '24/7', 'GLOBAL'],
        forceDirection: 'left',
    },
    {
        id: 'harness',
        refPointName: 'Harness_Ref_Point_01',
        position: new THREE.Vector3(0.0082, 0.9229, 0.035),
        scrollStart: 0.25,
        scrollEnd: 0.3,
        title: 'FUEL',
        subtitle: 'FUEL TELEMATICS',
        description: 'Detect siphoning, fraud, and inefficient idling with real-time alerts.',
        stats: ['99%', 'REAL-TIME', 'ALERTS'],
        forceDirection: 'left',
    },
    {
        id: 'precision-tracking',
        refPointName: 'Prob_Ref_Point_005',
        position: new THREE.Vector3(-0.2272, 0.531, 0.0636),
        scrollStart: 0.58,
        scrollEnd: 0.62,
        title: 'PRECISION TRACKING',
        subtitle: 'TRANSLINK TRACKING',
        description:
            'Military-grade GNSS tracking with sub-meter accuracy. 24/7 visibility, historical playback, and intelligent geofencing.',
        stats: ['0.002ms', '99.99%', 'GLOBAL'],
    },
    {
        id: 'iot-sensor',
        refPointName: 'Filter_Ref_Point_006',
        position: new THREE.Vector3(-0.26, 0.2629, 0.0713),
        scrollStart: 0.66,
        scrollEnd: 0.8,
        title: 'IOT SENSOR',
        subtitle: 'EDGE INTELLIGENCE',
        description:
            'Cold-chain monitoring, load sensing, BLE identification - everything connected.',
        stats: ['EDGE AI', 'BLE', 'REAL-TIME'],
    },
    {
        id: 'vision-ai',
        refPointName: 'Bolt_Ref_Point_002',
        position: new THREE.Vector3(-0.3167, 1.042, -0.02),
        scrollStart: 0.81,
        scrollEnd: 0.84,
        title: 'VISION AI',
        subtitle: 'ADAS & DMS',
        description:
            'Dual-stream AI cameras. Collision prevention, fatigue detection, in-cab coaching.',
        stats: ['5CH', '1080P', 'AI+'],
        forceDirection: 'left',
    },
    {
        id: 'contact',
        refPointName: 'Fuel_Head_Ref_Point_003',
        position: new THREE.Vector3(-0.2382, 0.923, 0.0987),
        scrollStart: 0.97,
        scrollEnd: 1.0,
        title: 'CONTACT',
        subtitle: 'GET STARTED',
        description:
            'Connect with our team. Transform your fleet data into a competitive advantage.',
        stats: ['+251 944-33-4344', '+251 980-42-4242', 'hello@translink.et'],
        forceDirection: 'left',
    },
    {
        id: 'visit-us',
        refPointName: 'Prob_Ref_Point_005',
        position: new THREE.Vector3(-0.2272, 0.531, 0.0636),
        scrollStart: 0.98,
        scrollEnd: 1.0,
        title: 'VISIT US',
        subtitle: 'ADDIS ABEBA, ETHIOPIA',
        description: 'Stop by our office. Experience our technology firsthand and meet the team.',
        stats: ['Kera, SD Bldg.', 'Office 404'],
        forceDirection: 'right',
    },
];

// --------------------------------------------------------------------------------------------------
// ANIMATION CONFIG
// --------------------------------------------------------------------------------------------------

const ANIM = {
    enterDuration: 0.6,
    exitDuration: 0.35,
    enterEase: 'power3.out',
    exitEase: 'power2.in',
    staggerDelay: 0.08,
};

// --------------------------------------------------------------------------------------------------
// PROJECTION
// --------------------------------------------------------------------------------------------------

// Reusable vector for projection (avoid GC pressure)
const _projectionVector = new THREE.Vector3();

function projectToScreen(worldPos: THREE.Vector3, camera: THREE.PerspectiveCamera): ScreenPos {
    _projectionVector.copy(worldPos);
    _projectionVector.project(camera);

    const x = (_projectionVector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_projectionVector.y * 0.5 + 0.5) * window.innerHeight;
    const visible = _projectionVector.z > 0 && _projectionVector.z < 1;

    const pixelRatio = window.devicePixelRatio || 1;
    const distance = camera.position.distanceTo(worldPos);
    // Normalize scaling: Base factor 40 / distance, scaled by DPI to maintain physical density
    const scale = THREE.MathUtils.clamp((40 * pixelRatio) / (distance * 10), 0.5, 1.5);

    return { x, y, visible, scale };
}

// ==================================================================================================
// WAYPOINT OVERLAY CONTROLLER
// ==================================================================================================

export class Waypoint {
    private overlays: Map<string, WaypointOverlayData> = new Map();
    private configs: Map<string, WaypointConfig> = new Map();
    private configsLoaded: boolean = false;
    private cachedObstacles: HTMLElement[] = [];

    constructor() {
        // Configs populated via loadConfig() - called before init()
    }

    /**
     * Load waypoint configuration from JSON
     * Source of truth: /assets/config/waypoint_config.json
     * Falls back to hardcoded FALLBACK_WAYPOINT_CONFIGS on failure
     */
    async loadConfig(): Promise<void> {
        try {
            const data = (await import('@/translinkconfig/waypoint_config.json'))
                .default as unknown as { waypoints: WaypointConfigJSON[] };

            const waypoints: WaypointConfigJSON[] = data.waypoints;
            this.configs.clear();
            waypoints.forEach((raw) => {
                const config = mapJSONToConfig(raw);
                this.configs.set(config.id, config);
            });

            this.configsLoaded = true;
            console.log(`[WaypointOverlay] Loaded ${this.configs.size} waypoints from config`);
        } catch (error) {
            console.warn(
                '[WaypointOverlay] Failed to load waypoint config, using fallback:',
                error
            );
            this.configs.clear();
            FALLBACK_WAYPOINT_CONFIGS.forEach((config) => {
                this.configs.set(config.id, config);
            });
            this.configsLoaded = true;
        }
    }

    /**
     * Build waypoint overlay DOM elements from loaded config.
     * Replaces the 7 hardcoded overlay blocks previously in index.html (lines 1275-1435).
     * Must be called after loadConfig() and before init().
     */
    buildDOM(): void {
        if (!this.configsLoaded) {
            console.warn(
                '[WaypointOverlay] buildDOM() called before loadConfig() - no overlays will be built'
            );
            return;
        }

        this.configs.forEach((config) => {
            // Remove any pre-existing overlay (safety guard for HMR / double-init)
            document.getElementById(`waypoint-overlay-${config.id}`)?.remove();

            const isContactType = config.id === 'contact';
            const pathStroke = isContactType ? '#161616' : 'rgba(22, 22, 22, 0.2)';

            // --- Root overlay ---------------------------------------
            const overlay = document.createElement('div');
            overlay.id = `waypoint-overlay-${config.id}`;
            overlay.className = 'waypoint-overlay';
            overlay.dataset.waypoint = config.id;

            // --- SVG connector --------------------------------------
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute(
                'style',
                'position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;'
            );

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.classList.add('waypoint-path');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', pathStroke);
            path.setAttribute('stroke-width', '1');
            path.setAttribute('stroke-linecap', 'round');

            const endpoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            endpoint.classList.add('waypoint-endpoint');
            endpoint.setAttribute('r', '3');
            endpoint.setAttribute('fill', '#161616');
            endpoint.setAttribute('opacity', '0');

            svg.appendChild(path);
            svg.appendChild(endpoint);

            // --- Pulse dot ------------------------------------------
            const pulse = document.createElement('div');
            pulse.className = 'waypoint-pulse';

            // --- Card -----------------------------------------------
            const card = document.createElement('div');
            card.className = 'waypoint-card';

            const cardInner = document.createElement('div');
            cardInner.className = 'waypoint-card-inner';

            // Contact overlay has a photo header row
            if (isContactType) {
                const photoRow = document.createElement('div');
                photoRow.style.cssText =
                    'display:flex;align-items:flex-start;gap:1rem;margin-bottom:0.75rem;';

                const photoFrame = document.createElement('div');
                photoFrame.style.cssText =
                    'width:60px;height:60px;border:1px solid #161616;border-radius:0;overflow:hidden;flex-shrink:0;background:transparent;';
                const img = document.createElement('img');
                img.src = config.image || './textures/ui/contact-placeholder.png';
                img.alt = config.title;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
                photoFrame.appendChild(img);

                const photoText = document.createElement('div');
                photoText.style.flex = '1';

                const titleEl = document.createElement('h3');
                titleEl.className = 'waypoint-card-title';
                titleEl.style.marginBottom = '0.25rem';
                titleEl.textContent = config.title;

                const subtitleEl = document.createElement('span');
                subtitleEl.className = 'waypoint-card-subtitle';
                subtitleEl.textContent = config.subtitle;

                photoText.appendChild(titleEl);
                photoText.appendChild(subtitleEl);
                photoRow.appendChild(photoFrame);
                photoRow.appendChild(photoText);
                cardInner.appendChild(photoRow);
            } else {
                const titleEl = document.createElement('h3');
                titleEl.className = 'waypoint-card-title';
                titleEl.textContent = config.title;
                cardInner.appendChild(titleEl);

                const subtitleEl = document.createElement('span');
                subtitleEl.className = 'waypoint-card-subtitle';
                subtitleEl.textContent = config.subtitle;
                cardInner.appendChild(subtitleEl);
            }

            const divider = document.createElement('div');
            divider.className = 'waypoint-card-divider';
            cardInner.appendChild(divider);

            const desc = document.createElement('p');
            desc.className = 'waypoint-card-desc';
            desc.textContent = config.description;
            cardInner.appendChild(desc);

            /* Stats moved to footer (handled by UIOverlay)
      const coordRow = document.createElement('div');
      coordRow.className = 'waypoint-card-coord';
      config.stats.forEach(stat => {
        const span = document.createElement('span');
        span.className = 'waypoint-coord-item';
        span.textContent = stat;
        coordRow.appendChild(span);
      });
      cardInner.appendChild(coordRow);
      */

            card.appendChild(cardInner);

            // --- Assemble -------------------------------------------
            overlay.appendChild(svg);
            overlay.appendChild(pulse);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
        });

        console.log(`[WaypointOverlay] Built ${this.configs.size} overlay DOM elements`);
    }

    /**
     * Initialize waypoint overlays from DOM.
     * Requires buildDOM() to have been called first.
     */
    init(): void {
        // Ensure configs are loaded (loadConfig() should be called before init())
        if (!this.configsLoaded) {
            console.warn('[WaypointOverlay] loadConfig() not called before init(), using fallback');
            FALLBACK_WAYPOINT_CONFIGS.forEach((config) => {
                this.configs.set(config.id, config);
            });
            this.configsLoaded = true;
        }

        this.configs.forEach((config) => {
            const overlay = document.getElementById(`waypoint-overlay-${config.id}`);
            if (!overlay) {
                console.warn(`[WaypointOverlay] Overlay not found: waypoint-overlay-${config.id}`);
                return;
            }

            // Reset overlay styles for transform-based positioning
            overlay.style.position = 'fixed';
            overlay.style.left = '0';
            overlay.style.top = '0';
            overlay.style.transformOrigin = '0 0';
            overlay.style.willChange = 'transform, opacity';
            overlay.style.pointerEvents = 'none';
            overlay.style.opacity = '0';
            overlay.style.zIndex = 'var(--z-waypoint-overlay)';

            const pulse = overlay.querySelector('.waypoint-pulse') as HTMLElement;
            const svg = overlay.querySelector('svg') as SVGSVGElement;
            const path = overlay.querySelector('.waypoint-path') as SVGPathElement;
            const endpoint = overlay.querySelector('.waypoint-endpoint') as SVGCircleElement;
            const card = overlay.querySelector('.waypoint-card') as HTMLElement;

            // Capture text elements for dynamic color updates
            const title = overlay.querySelector('.waypoint-card-title') as HTMLElement;
            const subtitle = overlay.querySelector('.waypoint-card-subtitle') as HTMLElement;
            const desc = overlay.querySelector('.waypoint-card-desc') as HTMLElement;
            const divider = overlay.querySelector('.waypoint-card-divider') as HTMLElement;
            const stats = Array.from(
                overlay.querySelectorAll('.waypoint-coord-item')
            ) as HTMLElement[];

            // Position children at origin
            if (pulse) {
                // Determine color scheme (all overlays use red for index page)
                const dotColor = 'var(--color-brand-accent)';
                const dotShadow = 'rgba(204, 39, 46, 0.4)';
                const ringColor = 'rgba(204, 39, 46, 0.5)';

                pulse.style.position = 'absolute';
                pulse.style.left = '0';
                pulse.style.top = '0';
                pulse.style.width = '10px';
                pulse.style.height = '10px';
                pulse.style.background = dotColor;
                pulse.style.borderRadius = '50%';
                pulse.style.transform = 'translate(-50%, -50%)';
                pulse.style.boxShadow = `0 0 12px ${dotShadow}`;
                pulse.style.opacity = '0';
                pulse.style.setProperty('--pulse-color', dotShadow);
                pulse.style.setProperty('--ring-color', ringColor);
                pulse.className = 'waypoint-pulse overlay-dot-enhanced';

                // Triple expanding pulse rings
                for (let i = 0; i < 3; i++) {
                    const pulseRing = document.createElement('div');
                    pulseRing.className = 'pulse-ring-wave';
                    pulseRing.style.animationDelay = `${i * 0.5}s`;
                    pulseRing.style.setProperty('--ring-color', ringColor);
                    pulse.appendChild(pulseRing);
                }

                // Rotating tech ring
                const techRing = document.createElement('div');
                techRing.className = 'tech-ring';
                techRing.style.setProperty('--ring-color', ringColor);
                pulse.appendChild(techRing);
            }

            if (svg) {
                svg.style.position = 'absolute';
                svg.style.left = '0';
                svg.style.top = '0';
                svg.style.overflow = 'visible';
                svg.style.width = '300px';
                svg.style.height = '150px';
            }

            if (card) {
                card.style.position = 'absolute';
                card.style.pointerEvents = 'auto';
                card.style.opacity = '0';
                card.style.transform = 'translateY(10px)';
                card.style.left = '0';
                card.style.top = '0';
            }

            this.overlays.set(config.id, {
                overlay,
                pulse,
                svg,
                path,
                endpoint,
                card,
                title,
                subtitle,
                desc,
                stats,
                divider,
                isVisible: false,
                isAnimating: false,
                screenX: 0,
                screenY: 0,
                dirX: 1,
                dirY: -1,
                initialDirX: null, // Will be set on first entry
                initialDirY: null, // Will be set on first entry
                lastColorProgress: -1, // Initialize to -1 to force first update
            });
        });

        console.log('[WaypointOverlay] Initialized:', this.overlays.size, 'overlays');
        // Cache obstacles once to avoid querySelectorAll on every frame
        this.cachedObstacles = Array.from(
            document.querySelectorAll('.glass-card, .section-badge, .section-data-panel')
        ) as HTMLElement[];
    }

    /**
     * Animate overlay entrance
     */
    private animateEnter(data: WaypointOverlayData): void {
        if (data.isAnimating) {
            // Kill any existing animations to prevent conflicts
            gsap.killTweensOf([data.overlay, data.pulse, data.path, data.endpoint, data.card]);
        }
        data.isAnimating = true;

        const tl = gsap.timeline({
            onComplete: () => {
                data.isAnimating = false;
            },
        });

        // Fade in overlay container
        tl.to(
            data.overlay,
            {
                opacity: 1,
                duration: ANIM.enterDuration * 0.5,
                ease: ANIM.enterEase,
            },
            0
        );

        // Pulse dot appears first
        if (data.pulse) {
            tl.to(
                data.pulse,
                {
                    opacity: 1,
                    scale: 1,
                    duration: ANIM.enterDuration,
                    ease: 'back.out(1.5)',
                },
                0
            );
        }

        // SVG path draws in
        if (data.path) {
            if (!data.pathLength) data.pathLength = data.path.getTotalLength?.() || 200;
            const pathLength = data.pathLength;
            gsap.set(data.path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
            tl.to(
                data.path,
                {
                    strokeDashoffset: 0,
                    duration: ANIM.enterDuration,
                    ease: 'power2.out',
                },
                ANIM.staggerDelay
            );
        }

        // Endpoint dot
        if (data.endpoint) {
            tl.to(
                data.endpoint,
                {
                    opacity: 1,
                    duration: ANIM.enterDuration * 0.5,
                    ease: ANIM.enterEase,
                },
                ANIM.staggerDelay * 2
            );
        }

        // Card slides up and fades in
        if (data.card) {
            tl.to(
                data.card,
                {
                    opacity: 1,
                    y: 0,
                    duration: ANIM.enterDuration,
                    ease: ANIM.enterEase,
                },
                ANIM.staggerDelay * 3
            );
        }
    }

    /**
     * Animate overlay exit
     */
    private animateExit(data: WaypointOverlayData): void {
        if (data.isAnimating) {
            // Kill any existing animations to prevent conflicts
            gsap.killTweensOf([data.overlay, data.pulse, data.path, data.endpoint, data.card]);
        }
        data.isAnimating = true;

        const tl = gsap.timeline({
            onComplete: () => {
                data.isAnimating = false;
                data.overlay.classList.remove('active');
            },
        });

        // All elements fade out together
        if (data.card) {
            tl.to(
                data.card,
                {
                    opacity: 0,
                    y: -5,
                    duration: ANIM.exitDuration,
                    ease: ANIM.exitEase,
                },
                0
            );
        }

        if (data.endpoint) {
            tl.to(
                data.endpoint,
                {
                    opacity: 0,
                    duration: ANIM.exitDuration * 0.5,
                    ease: ANIM.exitEase,
                },
                0
            );
        }

        if (data.path) {
            if (!data.pathLength) data.pathLength = data.path.getTotalLength?.() || 200;
            const pathLength = data.pathLength;
            tl.to(
                data.path,
                {
                    strokeDashoffset: pathLength,
                    duration: ANIM.exitDuration,
                    ease: ANIM.exitEase,
                },
                0
            );
        }

        if (data.pulse) {
            tl.to(
                data.pulse,
                {
                    opacity: 0,
                    scale: 0.5,
                    duration: ANIM.exitDuration,
                    ease: ANIM.exitEase,
                },
                0
            );
        }

        // Container fades last
        tl.to(
            data.overlay,
            {
                opacity: 0,
                duration: ANIM.exitDuration,
                ease: ANIM.exitEase,
            },
            ANIM.exitDuration * 0.3
        );
    }

    /**
     * Update all waypoint overlays
     */
    update(camera: THREE.PerspectiveCamera, scrollProgress: number): void {
        if (!camera || this.overlays.size === 0) return;

        // READ PHASE: Evaluate obstacle rects ONCE per frame before writes to prevent layout thrash
        const obstacleRects = this.cachedObstacles.map((obs) => obs.getBoundingClientRect());

        this.overlays.forEach((data, id) => {
            const config = this.configs.get(id);
            if (!config) return;

            const inScrollRange =
                scrollProgress >= config.scrollStart && scrollProgress <= config.scrollEnd;

            // Project 3D position to screen (always calculate for smooth transitions)
            const screenPos = projectToScreen(config.position, camera);
            const shouldShow = inScrollRange && screenPos.visible;

            // Handle exit when out of scroll range or not visible
            if (!shouldShow && data.isVisible) {
                data.isVisible = false;
                this.animateExit(data);
                return;
            }

            // Trigger enter animation when entering scroll range
            if (shouldShow && !data.isVisible) {
                data.isVisible = true;
                data.overlay.classList.add('active');

                // Calculate direction ONLY on first entry, then reuse for consistency
                if (data.initialDirX === null || data.initialDirY === null) {
                    // First time entry - calculate and store direction
                    if (config.forceDirection) {
                        // Use forced direction from config
                        data.dirX = config.forceDirection === 'left' ? -1 : 1;
                    } else {
                        // Auto-calculate based on screen position
                        data.dirX = screenPos.x < window.innerWidth / 2 ? 1 : -1;
                    }
                    data.dirY = screenPos.y > window.innerHeight / 2 ? -1 : 1;

                    // Store initial direction for future entries
                    data.initialDirX = data.dirX;
                    data.initialDirY = data.dirY;
                } else {
                    // Reuse stored direction for consistency (backward scroll)
                    data.dirX = data.initialDirX;
                    data.dirY = data.initialDirY;
                }

                // Initialize position
                data.screenX = screenPos.x;
                data.screenY = screenPos.y;

                // Set initial transform
                data.overlay.style.transform = `translate(${screenPos.x}px, ${screenPos.y}px) scale(${screenPos.scale})`;

                // Force immediate color update on entry
                data.lastColorProgress = -1;
                this.updateOverlayColors(data);

                // Trigger enter animation
                this.animateEnter(data);
            }

            // Skip updates if not visible
            if (!data.isVisible) return;

            // Dynamic color management based on scroll progress
            // Update colors when progress changes significantly (avoid excessive DOM updates)
            const colorThreshold = 0.005; // Update every 0.5% scroll change (more responsive)
            if (Math.abs(scrollProgress - data.lastColorProgress) > colorThreshold) {
                data.lastColorProgress = scrollProgress;
                this.updateOverlayColors(data);
            }

            // CRITICAL: Direct position update (no lerping) for perfect synchronization
            // Overlays must move exactly with their target meshes in the same frame
            data.screenX = screenPos.x;
            data.screenY = screenPos.y;

            // Apply transform to parent
            data.overlay.style.transform = `translate(${data.screenX}px, ${data.screenY}px) scale(${screenPos.scale})`;

            // Use LOCKED direction (set on entry, stays consistent during visibility)
            const dir = data.dirX;
            const vertDir = data.dirY;

            // Responsive metrics: Use smaller stalks on mobile to prevent screen overflow
            const isMobile = window.innerWidth < 768;
            const H1 = isMobile ? 25 : 40;
            const V = isMobile ? 20 : 30;
            const H2 = isMobile ? 35 : 60;
            const R = 8;
            const cardEstimatedWidth = isMobile ? 120 : 200;
            const viewportPadding = 20;

            // SMART DIRECTION: Check if forced direction causes overflow
            let activeDir = dir;
            const predictedRight =
                data.screenX +
                (H1 + H2 + 10) * activeDir +
                (activeDir > 0 ? cardEstimatedWidth : 0);
            const predictedLeft =
                data.screenX +
                (H1 + H2 + 10) * activeDir -
                (activeDir < 0 ? cardEstimatedWidth : 0);

            if (activeDir > 0 && predictedRight > window.innerWidth - viewportPadding) {
                activeDir = -1;
            } else if (activeDir < 0 && predictedLeft < viewportPadding) {
                activeDir = 1;
            }

            // COLLISION AVOIDANCE: Check for overlaps with section content
            let collisionPush = 0;

            if (data.card) {
                // Calculate estimated unpushed bounds of the card mathematically
                // to avoid DOM reads (getBoundingClientRect) after DOM writes (transform)
                const unpushedY = V * vertDir;
                const cardX = data.screenX + (H1 + H2 + 10) * activeDir;
                const cardY = data.screenY + unpushedY;
                const cardWidth = cardEstimatedWidth;
                const cardHeight = 80; // Estimated max height

                const cardLeft = activeDir < 0 ? cardX - cardWidth : cardX;
                const cardRight = activeDir < 0 ? cardX : cardX + cardWidth;
                const cardTop = cardY - cardHeight / 2;
                const cardBottom = cardY + cardHeight / 2;

                obstacleRects.forEach((obsRect) => {
                    // Simple rect overlap check
                    if (
                        cardRight > obsRect.left &&
                        cardLeft < obsRect.right &&
                        cardBottom > obsRect.top &&
                        cardTop < obsRect.bottom
                    ) {
                        // Overlap detected! Push down or up based on vertical position
                        collisionPush = data.screenY < window.innerHeight / 2 ? 120 : -120;
                    }
                });
            }

            // SVG path using collision-aware finalY
            const finalY = (V + collisionPush) * vertDir;
            const pathD = [
                `M 0 0`,
                `L ${(H1 - R) * activeDir} 0`,
                `Q ${H1 * activeDir} 0 ${H1 * activeDir} ${R * vertDir}`,
                `L ${H1 * activeDir} ${finalY - R * vertDir}`,
                `Q ${H1 * activeDir} ${finalY} ${(H1 + R) * activeDir} ${finalY}`,
                `L ${(H1 + H2) * activeDir} ${finalY}`,
            ].join(' ');

            if (data.path) {
                data.path.setAttribute('d', pathD);
            }

            if (data.endpoint) {
                data.endpoint.setAttribute('cx', `${(H1 + H2) * activeDir}`);
                data.endpoint.setAttribute('cy', `${finalY}`);
            }

            if (data.card) {
                const cardOffsetX = (H1 + H2 + 10) * activeDir;
                const cardOffsetY = finalY;

                data.card.style.left = `${cardOffsetX}px`;
                data.card.style.top = `${cardOffsetY}px`;

                // Use GSAP-safe centering to ensure path connects to middle of card height
                if (activeDir < 0) {
                    gsap.set(data.card, { xPercent: -100, yPercent: -50 });
                } else {
                    gsap.set(data.card, { xPercent: 0, yPercent: -50 });
                }
            }
        });
    }

    /**
     * Update overlay colors based on scroll progress
     */
    private updateOverlayColors(data: WaypointOverlayData): void {
        const colors = OVERLAY_COLORS;

        // Update text colors with smooth transition
        if (data.title) {
            data.title.style.color = colors.titleColor;
            data.title.style.transition = 'color 0.5s ease';
        }

        if (data.subtitle) {
            data.subtitle.style.color = colors.subtitleColor;
            data.subtitle.style.transition = 'color 0.5s ease';
        }

        if (data.desc) {
            data.desc.style.color = colors.descColor;
            data.desc.style.transition = 'color 0.5s ease';
        }

        if (data.divider) {
            data.divider.style.background = `linear-gradient(90deg, ${colors.dividerColor}, transparent)`;
            data.divider.style.transition = 'background 0.5s ease';
        }

        data.stats.forEach((stat) => {
            stat.style.color = colors.statsColor;
            stat.style.transition = 'color 0.5s ease';
        });

        // Update SVG path color
        if (data.path) {
            data.path.setAttribute('stroke', colors.pathStroke);
        }

        // Pulse dot and rings keep red color for consistency
    }

    /**
     * Cleanup - kills animations and removes JS-built overlay DOM nodes
     */
    destroy(): void {
        this.overlays.forEach((data) => {
            if (data.isAnimating) {
                gsap.killTweensOf([data.overlay, data.pulse, data.path, data.endpoint, data.card]);
            }
            // Remove the JS-built overlay from the DOM
            data.overlay?.remove();
        });
        this.overlays.clear();
        this.configs.clear();
    }
}
