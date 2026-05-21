/**
 * UIOverlay
 *
 * Automatic labeling system using Three.js CSS2DRenderer.
 * Reads Ref_Point names from the loaded GLB model and creates
 * anchored UI waypoint labels dynamically, synced with
 * GSAP scroll animations and camera movement.
 *
 * Architecture:
 * - CSS2DRenderer overlays the WebGL canvas
 * - CSS2DObjects are attached to discovered Ref_Point positions
 * - Labels show/hide based on scroll progress ranges (from waypoint_config.json)
 * - GSAP animations for smooth entrance/exit
 * - Colors adapt to background transitions (dark/light)
 */

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { gsap } from '@/translinkscene/core/gsap';
import { getWaypointScale } from '@/translinkscene/systems/responsiveSystem';
import waypointConfigData from '@/translinkconfig/waypoint_config.json';
import { TranslinkLanguageController } from '@/translink/controllers/TranslinkLanguageController';

// --------------------------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------------------------

interface RefPointLabel {
    name: string; // GLB object name (e.g. "Fuel_Head_Ref_Point_003")
    displayName: string; // Title text
    subtitle: string; // Subtitle text
    description: string; // Description text
    stats: string[]; // Stat items
    object3D: THREE.Object3D; // Source ref point in the scene
    css2dObject: CSS2DObject; // CSS2DObject attached to scene
    element: HTMLElement; // Root DOM element
    scrollStart: number; // Visibility scroll start
    scrollEnd: number; // Visibility scroll end
    isVisible: boolean; // Current visibility state
    waypointId: string; // e.g. "fuel-head", "harness"
    forceDirection: 'left' | 'right' | null;
    lastColorZone: string; // Track color zone to avoid redundant updates
}

interface WaypointMapping {
    id: string;
    refPointName: string;
    scrollStart: number;
    scrollEnd: number;
    title: string;
    subtitle: string;
    description: string;
    stats: string[];
    image?: string;
    forceDirection?: 'left' | 'right';
}

// --------------------------------------------------------------------------------------------------
// CSS2D LABEL SYSTEM
// --------------------------------------------------------------------------------------------------

export class UIOverlay {
    private renderer: CSS2DRenderer;
    private labels: Map<string, RefPointLabel> = new Map();
    private waypointMappings: Map<string, WaypointMapping> = new Map();
    private isInitialized = false;

    constructor() {
        this.renderer = new CSS2DRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        const el = this.renderer.domElement;
        el.id = 'css2d-label-layer';
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.pointerEvents = 'none';
        el.style.zIndex = 'var(--z-waypoint-overlay)';
        el.style.overflow = 'hidden';
        el.style.direction = 'ltr'; // Force LTR for precise 2D coordinate projections
    }

    /** Mount the CSS2DRenderer DOM element */
    mount(): void {
        document.body.appendChild(this.renderer.domElement);
    }

    /** Load waypoint content mappings from static config (no async I/O) */
    loadWaypointConfig(): void {
        const data = waypointConfigData as any;
        const lang = TranslinkLanguageController.getInstance();

        this.waypointMappings.clear();
        (data.waypoints as any[]).forEach((wp) => {
            const tTitle = lang.t(`waypoints.${wp.id}.title`);
            const tSub = lang.t(`waypoints.${wp.id}.subtitle`);
            const tDesc = lang.t(`waypoints.${wp.id}.description`);
            const tStats = lang.tArray(`waypoints.${wp.id}.stats`);

            this.waypointMappings.set(wp.id, {
                id: wp.id,
                refPointName: wp.refPointName,
                scrollStart: wp.scrollStart,
                scrollEnd: wp.scrollEnd,
                title: tTitle && tTitle !== `waypoints.${wp.id}.title` ? tTitle : wp.content.title,
                subtitle:
                    tSub && tSub !== `waypoints.${wp.id}.subtitle` ? tSub : wp.content.subtitle,
                description:
                    tDesc && tDesc !== `waypoints.${wp.id}.description`
                        ? tDesc
                        : wp.content.description,
                stats:
                    tStats && tStats.length > 0 && tStats[0] !== `waypoints.${wp.id}.stats`
                        ? tStats
                        : wp.content.stats,
                image: wp.content.image,
                forceDirection: wp.styling?.forceDirection,
            });
        });
    }

    /**
     * Scan the loaded GLB model for all Ref_Point objects,
     * cross-reference with waypoint config, and create CSS2DObject labels.
     */
    discoverAndBuild(model: THREE.Group, scene: THREE.Scene): void {
        // Step 1: Discover all ref points from the GLB model
        const discovered = new Map<string, { worldPos: THREE.Vector3; obj: THREE.Object3D }>();

        model.traverse((child) => {
            if (child.name.includes('Ref_Point')) {
                const wp = new THREE.Vector3();
                child.getWorldPosition(wp);
                discovered.set(child.name, { worldPos: wp, obj: child });
            }
        });

        // Step 2: For each waypoint mapping, find its GLB ref point and create a label
        this.waypointMappings.forEach((mapping) => {
            const refPoint = discovered.get(mapping.refPointName);
            if (!refPoint) {
                console.warn(
                    `[UIOverlay] Ref point "${mapping.refPointName}" not found in GLB for waypoint "${mapping.id}"`
                );
                return;
            }

            const element = this.buildLabelElement(mapping);
            const css2d = new CSS2DObject(element);
            css2d.position.copy(refPoint.worldPos);
            css2d.visible = false;
            css2d.layers.set(0);
            scene.add(css2d);

            this.labels.set(mapping.id, {
                name: refPoint.obj.name,
                displayName: mapping.title,
                subtitle: mapping.subtitle,
                description: mapping.description,
                stats: mapping.stats,
                object3D: refPoint.obj,
                css2dObject: css2d,
                element,
                scrollStart: mapping.scrollStart,
                scrollEnd: mapping.scrollEnd,
                isVisible: false,
                waypointId: mapping.id,
                forceDirection: mapping.forceDirection ?? null,
                lastColorZone: '',
            });
        });

        this.isInitialized = true;
    }

    // --- DOM BUILDER -----------------------------------------

    private buildLabelElement(mapping: WaypointMapping): HTMLElement {
        // Direction: explicit config or default to 'left' (model is generally center-right)
        const dir = mapping.forceDirection === 'right' ? 1 : -1;
        const isContact = mapping.id === 'contact';

        const root = document.createElement('div');
        root.className = 'css2d-wp css2d-wp-root';
        root.style.pointerEvents = 'none';
        root.style.zIndex = '5000'; // Force to the absolute front
        root.dataset.waypointId = mapping.id;

        // Anchor dot (at 0,0)
        const dot = document.createElement('div');
        dot.className = 'css2d-wp-dot';

        // Pulse rings for Anchor
        for (let i = 0; i < 2; i++) {
            const ring = document.createElement('div');
            ring.className = 'css2d-wp-ring';
            ring.style.animationDelay = `${i * 0.6}s`;
            dot.appendChild(ring);
        }
        root.appendChild(dot);

        // SVG connector (L-shaped line from anchor dot to card endpoint)
        // Dynamic scaling: connectors shrink on mobile to prevent viewport overflow
        const isMobile = window.innerWidth < 768;
        const { H, V, H2 } = getWaypointScale();

        let epX: number, epY: number;
        if (isMobile) {
            // Mobile: Project UPWARD or DOWNWARD based on ID - tighter gaps
            epX = 0;
            const tightV = V * 0.6; // Reduce vertical projection length
            if (mapping.id === 'visit-us') {
                epY = tightV + 10; // Downward
            } else {
                epY = -(tightV + 10); // Upward (Contact, etc)
            }
        } else {
            // Desktop/Tablet: Project SIDEWAYS
            epX = (H + H2) * dir;
            epY = -V;
        }

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'css2d-wp-svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '100');
        svg.style.cssText = 'position:absolute;top:0;left:0;overflow:visible;pointer-events:none;';

        const path = document.createElementNS(svgNS, 'path');
        let d: string;
        if (isMobile) {
            d = `M 0 0 L 0 ${epY}`; // Simple vertical line
        } else {
            d = `M 0 0 L ${H * dir} 0 L ${H * dir} ${V * -1} L ${epX} ${epY}`;
        }
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'var(--theme-wp-path)');
        path.setAttribute('stroke-width', '1.2');

        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('class', 'css2d-wp-path');
        svg.appendChild(path);

        const endDot = document.createElementNS(svgNS, 'circle');
        endDot.setAttribute('cx', `${epX}`);
        endDot.setAttribute('cy', `${epY}`);
        endDot.setAttribute('r', '3');
        endDot.setAttribute('fill', 'var(--theme-wp-dot)');
        endDot.setAttribute('class', 'css2d-wp-endpoint');
        svg.appendChild(endDot);

        root.appendChild(svg);

        // Card - positioned exactly at the path endpoint
        const card = document.createElement('div');
        card.className = 'css2d-wp-card';
        const isRtl = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        card.style.direction = isRtl ? 'rtl' : 'ltr';

        if (isMobile) {
            // Mobile: Card centered above/below the vertical projection line
            card.style.left = `${epX}px`;
            if (mapping.id === 'visit-us') {
                card.style.top = `${epY + 10}px`;
                gsap.set(card, { xPercent: -50, yPercent: 0 });
            } else {
                card.style.top = `${epY - 10}px`;
                gsap.set(card, { xPercent: -50, yPercent: -100 });
            }
            card.style.textAlign = 'center';
        } else {
            if (dir < 0) {
                // Left direction: card right edge touches endpoint (with gap)
                card.style.left = `${epX - 10}px`;
                card.style.top = `${epY}px`;
                gsap.set(card, { xPercent: -100, yPercent: -50 });
                card.style.textAlign = 'right';
            } else {
                // Right direction: card left edge starts at endpoint (with gap)
                card.style.left = `${epX + 10}px`;
                card.style.top = `${epY}px`;
                gsap.set(card, { xPercent: 0, yPercent: -50 });
                card.style.textAlign = 'left';
            }
        }

        // Ensure title/subtitle also follow alignment
        const align = isMobile ? 'center' : dir < 0 ? 'right' : 'left';
        const flexAlign = isMobile ? 'center' : dir < 0 ? 'flex-end' : 'flex-start';

        // Contact with image
        if (isContact && mapping.image) {
            const photoRow = document.createElement('div');
            photoRow.className = 'css2d-wp-photo-row';
            photoRow.style.justifyContent = flexAlign;
            if (isMobile) photoRow.style.flexDirection = 'column';
            if (isMobile) photoRow.style.alignItems = 'center';
            if (isMobile) photoRow.style.gap = '0.5rem';

            if (dir > 0) {
                // Photo on left
                const img = document.createElement('img');
                img.src = mapping.image;
                img.alt = mapping.title;
                img.className = 'css2d-wp-photo';
                photoRow.appendChild(img);

                const textCol = document.createElement('div');
                const t = document.createElement('div');
                t.className = 'css2d-wp-title';
                t.textContent = mapping.title;
                const s = document.createElement('div');
                s.className = 'css2d-wp-subtitle';
                s.textContent = mapping.subtitle;
                textCol.appendChild(t);
                textCol.appendChild(s);
                photoRow.appendChild(textCol);
            } else {
                // Photo on right
                const textCol = document.createElement('div');
                textCol.style.textAlign = 'right';
                const t = document.createElement('div');
                t.className = 'css2d-wp-title';
                t.textContent = mapping.title;
                const s = document.createElement('div');
                s.className = 'css2d-wp-subtitle';
                s.textContent = mapping.subtitle;
                textCol.appendChild(t);
                textCol.appendChild(s);
                photoRow.appendChild(textCol);

                const img = document.createElement('img');
                img.src = mapping.image;
                img.alt = mapping.title;
                img.className = 'css2d-wp-photo';
                photoRow.appendChild(img);
            }
            card.appendChild(photoRow);
        } else {
            const t = document.createElement('div');
            t.className = 'css2d-wp-title';
            t.style.textAlign = align;
            t.textContent = mapping.title;
            card.appendChild(t);

            const s = document.createElement('div');
            s.className = 'css2d-wp-subtitle';
            s.style.textAlign = align;
            s.textContent = mapping.subtitle;
            card.appendChild(s);
        }

        const divider = document.createElement('div');
        divider.className = 'css2d-wp-divider';
        if (dir < 0) {
            divider.style.background = 'linear-gradient(270deg, var(--brand-crimson), transparent)';
        }
        card.appendChild(divider);

        const desc = document.createElement('p');
        desc.className = 'css2d-wp-desc';
        desc.style.textAlign = align;
        desc.style.padding = '0';
        desc.style.margin = '0';
        desc.textContent = mapping.description;
        if (isContact) desc.style.marginBottom = isMobile ? '0.05rem' : '0.2rem';
        card.appendChild(desc);

        // Stats section - Render as links for contact waypoint
        if (mapping.stats && mapping.stats.length > 0) {
            const statsContainer = document.createElement('div');
            statsContainer.className = 'css2d-wp-stats';
            statsContainer.style.flexDirection = 'column';
            statsContainer.style.alignItems = align === 'right' ? 'flex-end' : 'flex-start';
            statsContainer.style.marginTop = isContact ? (isMobile ? '0rem' : '0.1rem') : '0.5rem';
            statsContainer.style.gap = isMobile ? '0rem' : '0.1rem';

            mapping.stats.forEach((stat) => {
                const statEl = document.createElement('div');
                statEl.className = isContact ? 'css2d-wp-contact-stat' : 'css2d-wp-stat';

                if (isContact) {
                    if (stat.includes('@')) {
                        statEl.innerHTML = `<a href="mailto:${stat}" class="hover:text-crimson transition-colors" style="pointer-events: auto; color: inherit; text-decoration: none;">${stat}</a>`;
                    } else if (stat.match(/[+0-9- ]{7,}/)) {
                        const tel = stat.replace(/[^0-9+]/g, '');
                        statEl.innerHTML = `<a href="tel:${tel}" class="hover:text-crimson transition-colors" style="pointer-events: auto; color: inherit; text-decoration: none;">${stat}</a>`;
                    } else {
                        statEl.textContent = stat;
                    }
                    statEl.style.background = 'transparent';
                    statEl.style.color = 'var(--theme-wp-title)';
                    statEl.style.padding = '0';
                    statEl.style.boxShadow = 'none';
                    statEl.style.fontSize = isMobile ? '12px' : 'clamp(11px, 1.4vw, 15px)';
                    statEl.style.fontWeight = '700';
                    statEl.style.whiteSpace = 'nowrap';
                    statEl.style.lineHeight = '1.1';
                    statEl.style.textTransform = 'none';
                } else {
                    statEl.textContent = stat;
                }
                statsContainer.appendChild(statEl);
            });
            card.appendChild(statsContainer);
        }

        root.appendChild(card);
        return root;
    }

    // --- UPDATE LOOP -----------------------------------------
    private lastProgress = -1;

    /** Called every frame from World */
    update(scrollProgress: number): void {
        if (!this.isInitialized) return;

        // PERFORMANCE: Skip if scroll hasn't changed
        if (Math.abs(scrollProgress - this.lastProgress) < 0.0004) return;
        this.lastProgress = scrollProgress;

        this.labels.forEach((label) => {
            const inRange =
                scrollProgress >= label.scrollStart && scrollProgress <= label.scrollEnd;

            if (inRange && !label.isVisible) {
                // ENTER
                label.isVisible = true;
                label.css2dObject.visible = true;

                // BATCHED: Kill existing animations for this element group
                gsap.killTweensOf([
                    label.element,
                    label.element.querySelector('.css2d-wp-path'),
                    label.element.querySelector('.css2d-wp-card'),
                ]);

                gsap.fromTo(
                    label.element,
                    { opacity: 0, scale: 0.9 },
                    { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }
                );

                // Animate SVG path draw-in
                const path = label.element.querySelector('.css2d-wp-path') as SVGPathElement;
                if (path) {
                    // PERFORMANCE: Calculate length once and cache it to avoid layout thrashing
                    let len = (path as any)._cachedLength;
                    if (!len) {
                        len = path.getTotalLength?.() || 120;
                        (path as any)._cachedLength = len;
                    }

                    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
                    gsap.to(path, {
                        strokeDashoffset: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        delay: 0.1,
                    });
                }

                // Animate card
                const card = label.element.querySelector('.css2d-wp-card') as HTMLElement;
                if (card) {
                    gsap.fromTo(
                        card,
                        { opacity: 0, y: 6 },
                        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.15 }
                    );
                }
            } else if (!inRange && label.isVisible) {
                // EXIT
                label.isVisible = false;

                gsap.killTweensOf(label.element);
                gsap.to(label.element, {
                    opacity: 0,
                    scale: 0.95,
                    duration: 0.3,
                    ease: 'power2.in',
                    onComplete: () => {
                        label.css2dObject.visible = false;
                    },
                });
            }
        });

        // Update active section's footer stats
        this.updateFooterStats();
    }

    /**
     * Refactored: Footer stats are now managed via the static design system,
     * not dynamic 3D waypoint mirrors. Removed unauthorized injection.
     */
    private updateFooterStats(): void {
        // Feature removed as per audit request
    }

    // --- RENDER ----------------------------------------------

    /** Render the CSS2D layer - call after WebGLRenderer.render() */
    render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
        this.renderer.render(scene, camera);
    }

    /** Handle viewport resize */
    resize(width: number, height: number): void {
        this.renderer.setSize(width, height);
    }

    /** Cleanup */
    destroy(): void {
        this.labels.forEach((label) => {
            gsap.killTweensOf(label.element);
            label.css2dObject.removeFromParent();
        });
        this.labels.clear();
        this.renderer.domElement.remove();
    }
}
