/**
 * Responsive System - Single Source of Truth
 *
 * Centralized hub for ALL viewport-aware logic:
 * - Device profile detection (mobile / tablet / desktop / ultra-wide)
 * - Live viewport metrics (width, height, aspect, --vh, pixelRatio)
 * - Waypoint connector scaling (dynamic SVG geometry per breakpoint)
 * - Camera FOV compensation (portrait <-> ultra-wide)
 * - Camera distance compensation (aspect-ratio framing)
 * - Safari / iOS platform fixes
 * - Landscape mode handling
 *
 * Consumers:
 *  World.ts          -> getResponsiveFOV(), getAspectCompensation()
 *  UIOverlay.ts      -> getWaypointScale()
 *  GlobalUIBuilder.ts -> --vh CSS variable
 *  TranslinkFlow.ts  -> getDeviceInfo()
 *  main.ts           -> getResponsiveFOV()
 */

export interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isIOS: boolean;
    isSafari: boolean;
    isLandscape: boolean;
    pixelRatio: number;
    screenWidth: number;
    screenHeight: number;
}

/** Live viewport dimensions - recalculated on every resize */
export interface ViewportMetrics {
    width: number;
    height: number;
    aspect: number;
    /** Safari-safe 1vh value in px (accounts for URL-bar collapse) */
    vh: number;
    pixelRatio: number;
}

/** Dynamic waypoint SVG connector geometry */
export interface WaypointScale {
    /** Horizontal arm from anchor dot (px) */
    H: number;
    /** Vertical arm height (px) */
    V: number;
    /** Second horizontal arm to card endpoint (px) */
    H2: number;
}

// --------------------------------------------------------------------------------------------------
// CONSTANTS
// --------------------------------------------------------------------------------------------------

/** Reference aspect ratio: 16:9 desktop */
const BASE_ASPECT = 16 / 9;

class DeviceOptimization {
    private deviceInfo: DeviceInfo;
    private orientationChangeCallbacks: Array<(isLandscape: boolean) => void> = [];
    private metrics: ViewportMetrics;

    constructor() {
        this.deviceInfo = this.detectDevice();
        this.metrics = this.computeMetrics();
        this.init();
    }

    /**
     * Initialize device optimizations
     */
    private init(): void {
        // Inject --vh on ALL browsers so any consumer can use calc(var(--vh, 1vh) * 100)
        this.injectVH();
        window.addEventListener('resize', () => {
            if (!this.deviceInfo.isMobile) {
                this.injectVH();
            }
        });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.injectVH(), 100);
        });

        // Apply Safari-specific fixes
        if (this.deviceInfo.isSafari) {
            this.applySafariFixes();
        }

        // Apply iOS-specific fixes
        if (this.deviceInfo.isIOS) {
            this.applyIOSFixes();
        }

        // Handle orientation changes
        this.setupOrientationListener();

        // Apply initial landscape optimizations
        if (this.deviceInfo.isLandscape) {
            this.applyLandscapeOptimizations();
        }

        console.log('[DeviceOptimization] Initialized:', this.deviceInfo);
    }

    // --- Viewport Metrics ---------------------------------------------------

    /** Compute live viewport metrics snapshot */
    private computeMetrics(): ViewportMetrics {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return {
            width: w,
            height: h,
            aspect: w / h,
            vh: h * 0.01,
            pixelRatio: window.devicePixelRatio || 1,
        };
    }

    /** Inject --vh CSS variable on :root for Safari-safe viewport height */
    private injectVH(): void {
        this.metrics = this.computeMetrics();
        document.documentElement.style.setProperty('--vh', `${this.metrics.vh}px`);
    }

    /** Get current viewport metrics */
    getViewportMetrics(): ViewportMetrics {
        return { ...this.metrics };
    }

    /**
     * Setup orientation change listener
     */
    private setupOrientationListener(): void {
        const handleOrientationChange = () => {
            const wasLandscape = this.deviceInfo.isLandscape;
            this.deviceInfo = this.detectDevice();
            const isLandscape = this.deviceInfo.isLandscape;

            if (wasLandscape !== isLandscape) {
                console.log(
                    '[DeviceOptimization] Orientation changed:',
                    isLandscape ? 'landscape' : 'portrait'
                );

                if (isLandscape) {
                    this.applyLandscapeOptimizations();
                } else {
                    this.removeLandscapeOptimizations();
                }

                // Notify callbacks
                this.orientationChangeCallbacks.forEach((callback) => callback(isLandscape));
            }
        };

        window.addEventListener('orientationchange', () => {
            setTimeout(handleOrientationChange, 100);
        });

        window.addEventListener('resize', handleOrientationChange);
    }

    /**
     * Detect device information
     */
    private detectDevice(): DeviceInfo {
        const ua = navigator.userAgent;
        const width = window.innerWidth;
        const height = window.innerHeight;

        return {
            isMobile: /iPhone|iPod|Android.*Mobile/i.test(ua) || width < 768,
            isTablet: /iPad|Android(?!.*Mobile)/i.test(ua) || (width >= 768 && width < 1024),
            isDesktop: width >= 1024,
            isIOS: /iPhone|iPad|iPod/i.test(ua),
            isSafari: /^((?!chrome|android).)*safari/i.test(ua),
            isLandscape: width > height,
            pixelRatio: window.devicePixelRatio || 1,
            screenWidth: width,
            screenHeight: height,
        };
    }

    /**
     * Apply Safari-specific fixes
     */
    private applySafariFixes(): void {
        console.log('[DeviceOptimization] Applying Safari fixes');

        // NOTE: --vh injection is now handled globally in init() for ALL browsers.
        // Safari-only CSS styles below consume var(--vh) which is always available.

        // Specialized Safari styles - uses a single block instead of 4 separate tags
        const style = document.createElement('style');
        style.id = 'safari-fixes';
        style.textContent = `
      @supports (-webkit-touch-callout: none) {
        /* Safari viewport fix */
        section { height: calc(var(--vh, 1vh) * 100) !important; }
        
        /* Performance: Promote only major containers to GPU layers. 
           AVOID using "*" as it crashes Safari mobile by creating 1000s of layers. */
        section, .container, .glass-card, .canvas-fixed {
          -webkit-transform: translateZ(0);
          -webkit-backface-visibility: hidden;
        }
      }
    `;
        document.head.appendChild(style);

        // 3. Metadata optimization for canvas
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.setAttribute('data-safari-optimized', 'true');
    }

    /**
     * Apply iOS-specific fixes
     */
    private applyIOSFixes(): void {
        console.log('[DeviceOptimization] Applying iOS fixes');

        document.body.style.overscrollBehavior = 'none';

        const style = document.createElement('style');
        style.id = 'ios-fixes';
        style.textContent = `
      @supports (-webkit-touch-callout: none) {
        /* Prevent bounce, but allow scroll within content */
        body { position: fixed; width: 100%; overflow: hidden; }
        #flow-content { 
          overflow-y: auto; 
          -webkit-overflow-scrolling: touch; 
          height: calc(var(--vh, 1vh) * 100);
        }
        /* Prevent auto-zoom on inputs */
        input, textarea, select { font-size: 16px !important; }
        /* Safe area handling */
        body {
          padding: env(safe-area-inset-top) env(safe-area-inset-right) 
                   env(safe-area-inset-bottom) env(safe-area-inset-left);
        }
      }
    `;
        document.head.appendChild(style);
    }

    /**
     * Apply landscape mode optimizations
     */
    private applyLandscapeOptimizations(): void {
        console.log('[DeviceOptimization] Applying landscape optimizations');

        let style = document.getElementById('landscape-optimizations') as HTMLStyleElement;
        if (!style) {
            style = document.createElement('style');
            style.id = 'landscape-optimizations';
            document.head.appendChild(style);
        }

        style.textContent = `
      @media (orientation: landscape) and (max-height: 600px) { ... }
    `;
        // (Actual content removed for brevity in this replace chunk, but I will write the full contents below)
        this.writeLandscapeStyles(style);

        // Add landscape class to body
        document.body.classList.add('landscape-mode');
    }

    private writeLandscapeStyles(style: HTMLStyleElement): void {
        style.textContent = `
      @media (orientation: landscape) and (max-height: 600px) {
        section { padding-top: 2rem !important; padding-bottom: 2rem !important; }
        .hero-title-fluid { font-size: clamp(2rem, 6vw, 8rem) !important; }
        .section-title-fluid { font-size: clamp(1.5rem, 4vw, 4rem) !important; }
        .shard { display: none !important; }
        .glass-card { padding: 1.5rem !important; }
        .nav-dots { right: 1rem !important; }
        body::before {
          content: ''; position: fixed; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #c0202f, #c0202f);
          z-index: 10000; pointer-events: none;
        }
      }
    `;
    }

    /**
     * Remove landscape optimizations
     */
    private removeLandscapeOptimizations(): void {
        const style = document.getElementById('landscape-optimizations');
        if (style) {
            style.remove();
        }

        document.body.classList.remove('landscape-mode');
    }

    /**
     * Register orientation change callback
     */
    onOrientationChange(callback: (isLandscape: boolean) => void): void {
        this.orientationChangeCallbacks.push(callback);
    }

    /**
     * Get device info
     */
    getDeviceInfo(): DeviceInfo {
        return { ...this.deviceInfo };
    }

    /**
     * Check if device is mobile
     */
    isMobile(): boolean {
        return this.deviceInfo.isMobile;
    }

    /**
     * Check if device is tablet
     */
    isTablet(): boolean {
        return this.deviceInfo.isTablet;
    }

    /**
     * Check if device is desktop
     */
    isDesktop(): boolean {
        return this.deviceInfo.isDesktop;
    }

    /**
     * Check if device is iOS
     */
    isIOS(): boolean {
        return this.deviceInfo.isIOS;
    }

    /**
     * Check if browser is Safari
     */
    isSafari(): boolean {
        return this.deviceInfo.isSafari;
    }

    /**
     * Check if device is in landscape mode
     */
    isLandscape(): boolean {
        return this.deviceInfo.isLandscape;
    }

    /**
     * Get optimal texture size for device
     */
    getOptimalTextureSize(): number {
        const { isMobile, pixelRatio } = this.deviceInfo;

        if (isMobile) {
            return pixelRatio > 2 ? 1024 : 512;
        }

        return pixelRatio > 2 ? 2048 : 1024;
    }

    /**
     * Get optimal shadow map size for device
     */
    getOptimalShadowMapSize(): number {
        const { isMobile, pixelRatio } = this.deviceInfo;

        if (isMobile) {
            return 512;
        }

        return pixelRatio > 2 ? 2048 : 1024;
    }

    /**
     * Should use high quality rendering
     */
    shouldUseHighQuality(): boolean {
        const { isDesktop, pixelRatio } = this.deviceInfo;
        return isDesktop && pixelRatio <= 2;
    }

    // --- Centralized Scaling APIs -------------------------------------------

    /**
     * Get dynamic waypoint SVG connector geometry.
     * Scales the L-shaped connector arm to prevent viewport overflow on small screens.
     *
     * Breakpoint matrix:
     *   <=480px  -> H:25  V:20  H2:30  (55px total horizontal)
     *   <=768px  -> H:35  V:28  H2:40  (75px)
     *   <=1024px -> H:45  V:35  H2:55  (100px)
     *   >1024px -> H:60  V:45  H2:70  (130px - original desktop)
     */
    getWaypointScale(): WaypointScale {
        const w = this.metrics.width;
        if (w <= 480) return { H: 25, V: 20, H2: 30 };
        if (w <= 768) return { H: 35, V: 28, H2: 40 };
        if (w <= 1024) return { H: 45, V: 35, H2: 55 };
        return { H: 60, V: 45, H2: 70 };
    }

    /**
     * Calculate responsive FOV based on viewport aspect ratio.
     * Canonical formula - used by World.ts AND main.ts.
     *
     * Portrait (aspect < 1):    baseFOV + (1 - aspect) * 25  (up to +25 deg)
     * Ultra-wide (aspect > 16:9): baseFOV - ratio * 12       (up to -12 deg)
     * Standard range:           baseFOV unchanged
     */
    getResponsiveFOV(baseFOV: number, aspect?: number): number {
        const a = aspect ?? this.metrics.aspect;

        if (a < 1) {
            // Portrait mobile - widen FOV to compensate for vertical viewport
            return baseFOV + (1 - a) * 25;
        }

        if (a > BASE_ASPECT) {
            // Ultra-wide - reduce FOV to prevent edge distortion
            const ultraWideRatio = Math.min((a - BASE_ASPECT) / BASE_ASPECT, 0.6);
            return baseFOV - ultraWideRatio * 12;
        }

        return baseFOV;
    }

    /**
     * Calculate aspect ratio compensation for consistent camera framing.
     * Returns a multiplier applied to camera distance.
     *
     * Extreme portrait (< 0.6):  0.55  (bring camera much closer)
     * Portrait/tablet (0.6-1.0): 0.55 -> 0.90 (interpolate)
     * Standard (1.0-1.78):       1.0
     * Wider than ref (1.78-2.5): 1.0 -> 1.15 (slight increase)
     * Extreme ultra-wide (> 2.5): 1.15
     */
    getAspectCompensation(aspect?: number): number {
        const a = aspect ?? this.metrics.aspect;

        if (a < 0.6) {
            return 0.55;
        } else if (a < 1.0) {
            const t = (a - 0.6) / 0.4;
            return 0.55 + t * 0.35;
        } else if (a > 2.5) {
            return 1.15;
        } else if (a > BASE_ASPECT) {
            const t = Math.min(1, (a - BASE_ASPECT) / 1.0);
            return 1.0 + t * 0.15;
        }

        return 1.0;
    }

    /**
     * Get responsive animation offset.
     * Converts a fixed pixel offset (based on ~1080px height) to a vh-based unit.
     * Reduces the offset on mobile to prevent elements from exiting the viewport.
     */
    getAnimOffset(pxValue: number): string {
        const { isMobile } = this.deviceInfo;
        const factor = isMobile ? 0.5 : 1.0;
        // Map to vh: 100vh = ~1080px base
        const vhValue = (pxValue * factor) / 10.8;
        return `${vhValue}vh`;
    }
}

// Export singleton instance
export const deviceOptimization = new DeviceOptimization();

// --------------------------------------------------------------------------------------------------
// CONVENIENCE EXPORTS - zero-import access to scaling APIs
// --------------------------------------------------------------------------------------------------

/** Get dynamic waypoint connector geometry for current viewport */
export function getWaypointScale(): WaypointScale {
    return deviceOptimization.getWaypointScale();
}

/** Get responsive FOV for current or specified aspect ratio */
export function getResponsiveFOV(baseFOV: number, aspect?: number): number {
    return deviceOptimization.getResponsiveFOV(baseFOV, aspect);
}

/** Get camera distance multiplier for current or specified aspect ratio */
export function getAspectCompensation(aspect?: number): number {
    return deviceOptimization.getAspectCompensation(aspect);
}
