import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * PostProcessingController
 *
 * Manages the cinematic post-processing pipeline.
 * Cleaned of all atmospheric fog, bloom, and vignettes per user request.
 */
export class PostProcessingController {
    private composer: EffectComposer;

    constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
        this.composer = new EffectComposer(renderer);

        // 1. Initial Render Pass
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        // Bloom and Vignette passes have been removed per user request for a flat cream background

        // 2. Final Output Pass (Required for correct color space / sRGB)
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    /**
     * Executes the post-processing stack
     */
    render(): void {
        this.composer.render();
    }

    /**
     * Handle window resize
     */
    setSize(width: number, height: number): void {
        this.composer.setSize(width, height);
    }

    /**
     * Compatibility shim for removed bloom pass
     */
    setBloomStrength(_strength: number): void {
        // No-op: Bloom has been removed
    }
}
