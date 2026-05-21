import * as THREE from 'three';

/**
 * AdaptiveLightingController
 *
 * Dynamically modulates light intensities based on background luminance and scroll progress.
 * Implements Phase 2 of the Cinematic Lighting Audit.
 */
export class AdaptiveLightingController {
    private ambientLight: THREE.AmbientLight | null = null;
    private rimLight: THREE.DirectionalLight | null = null;
    private keyLight: THREE.DirectionalLight | null = null;

    private baseAmbientIntensity: number = 0;
    private baseRimIntensity: number = 0;
    private baseKeyIntensity: number = 0;

    constructor(
        options: {
            ambient?: THREE.AmbientLight;
            rim?: THREE.DirectionalLight;
            key?: THREE.DirectionalLight;
        } = {}
    ) {
        if (options.ambient) {
            this.ambientLight = options.ambient;
            this.baseAmbientIntensity = this.ambientLight.intensity;
        }
        if (options.rim) {
            this.rimLight = options.rim;
            this.baseRimIntensity = this.rimLight.intensity;
        }
        if (options.key) {
            this.keyLight = options.key;
            this.baseKeyIntensity = this.keyLight.intensity;
        }
    }

    /**
     * Update light intensities based on scroll progress
     * @param p Current scroll progress (0-1)
     */
    update(p: number): void {
        // Hardcoded Adaptive Lighting Rules (Cinematic Audit Phase 2)
        const rules = {
            enabled: true,
            increaseAmbientBy: 0.15,
            reduceAmbientBy: 0.1,
            increaseRimBy: 0.25,
            softenKey: true,
        };

        if (!rules.enabled) return;

        // Step 1: Calculate background luminance state (0 = light, 1 = dark)
        const darkFactor = this.calculateDarkFactor(p);

        // Step 2: Calculate target intensities based on rules
        const ambientTarget = this.calculateTargetIntensity(
            this.baseAmbientIntensity,
            rules.increaseAmbientBy,
            -rules.reduceAmbientBy,
            darkFactor
        );

        const rimTarget = this.calculateTargetIntensity(
            this.baseRimIntensity,
            rules.increaseRimBy,
            0,
            darkFactor
        );

        // Step 3: Apply smoothed updates
        const lerpFactor = 0.05;

        if (this.ambientLight) {
            this.ambientLight.intensity = THREE.MathUtils.lerp(
                this.ambientLight.intensity,
                ambientTarget,
                lerpFactor
            );
        }

        if (this.rimLight) {
            this.rimLight.intensity = THREE.MathUtils.lerp(
                this.rimLight.intensity,
                rimTarget,
                lerpFactor
            );
        }

        if (this.keyLight && rules.softenKey) {
            const keyTarget = THREE.MathUtils.lerp(
                this.baseKeyIntensity * 0.8,
                this.baseKeyIntensity,
                darkFactor
            );
            this.keyLight.intensity = THREE.MathUtils.lerp(
                this.keyLight.intensity,
                keyTarget,
                lerpFactor
            );
        }
    }

    private calculateDarkFactor(p: number): number {
        const transition = { start: 0.5714, end: 0.7143 };
        if (p < transition.start) return 1.0;
        if (p > transition.end) return 0.0;
        const t = (p - transition.start) / (transition.end - transition.start);
        return 1.0 - t;
    }

    private calculateTargetIntensity(
        base: number,
        darkOffset: number,
        lightOffset: number,
        darkFactor: number
    ): number {
        const darkTarget = base + darkOffset;
        const lightTarget = base + lightOffset;
        return THREE.MathUtils.lerp(lightTarget, darkTarget, darkFactor);
    }
}
