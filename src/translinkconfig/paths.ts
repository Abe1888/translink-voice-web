/**
 * Asset Paths Configuration
 *
 * Centralized asset path management with environment variable support
 * Using Meshopt compression (no Draco dependency)
 */

// Environment-aware configuration
// Asset split: translink_sense_meshopt.glb deprecated.
// Scene now loads sensor_assembly_meshopt.glb + truck_assembly_meshopt.glb separately.
const env = {
    sensorPath: import.meta.env.VITE_SENSOR_PATH || './models/sensor_assembly_meshopt.glb',
    truckPath: import.meta.env.VITE_TRUCK_PATH || './models/truck_assembly_meshopt.glb',
    hdrPath: import.meta.env.VITE_HDR_PATH || './textures/hdr/studio_small_09_1k.hdr',
    debug: import.meta.env.VITE_DEBUG === 'true',
    cameraDebug: import.meta.env.VITE_CAMERA_DEBUG === 'true',
    maxPixelRatio: getOptimalPixelRatio(),
    enableShadows: import.meta.env.VITE_ENABLE_SHADOWS !== 'false',
    assetVersion: import.meta.env.VITE_ASSET_VERSION || Date.now().toString(36),
};

/**
 * Get optimal pixel ratio based on device capabilities
 */
function getOptimalPixelRatio(): number {
    if (typeof window === 'undefined') return 2;

    const envMax = Number(import.meta.env.VITE_MAX_PIXEL_RATIO);
    if (envMax && !isNaN(envMax)) return envMax;

    const deviceRatio = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width * deviceRatio;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Mobile: cap at 2 for performance
    if (isMobile) return Math.min(deviceRatio, 2);

    // 4K+ displays: allow up to 2.5
    if (screenWidth >= 3840) return Math.min(deviceRatio, 2.5);

    // Standard displays: cap at 2
    return Math.min(deviceRatio, 2);
}

export const ASSET_PATHS = {
    models: {
        /** @deprecated translink_sense_meshopt.glb removed - use sensor + truck paths below */
        sensor: env.sensorPath,
        truck: env.truckPath,
    },
    hdr: {
        studio: env.hdrPath,
    },
} as const;

export const CAMERA_CONFIG = {
    fov: 35,
    near: 0.1,
    far: 1000,
    initialPosition: [5, 1.5, 5] as [number, number, number],
} as const;

export const RENDERER_CONFIG = {
    antialias: true,
    powerPreference: 'high-performance' as const,
    alpha: false,
    pixelRatioMax: env.maxPixelRatio,
    enableShadows: env.enableShadows,
} as const;
