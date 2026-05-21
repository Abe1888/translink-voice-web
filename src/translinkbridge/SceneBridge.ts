/**
 * SceneBridge
 *
 * The official communication layer between the 3D World (translinkscene)
 * and the 2D UI Layer (translink).
 *
 * Responsibilities:
 * 1. Synchronize the 3D ScrollTrigger with the DOM scroll height.
 * 2. Bridge events between the 3D world and the UI sections.
 * 3. Ensure the 3D Scene remains decoupled from the UI implementation.
 */

import { World } from '@/translinkscene/world/World';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export class SceneBridge {
    private world: World;
    private static instance: SceneBridge;

    constructor() {
        this.world = new World();
        SceneBridge.instance = this;
    }

    /** Access the singleton instance of the bridge */
    public static getInstance(): SceneBridge {
        return SceneBridge.instance;
    }

    /**
     * Initialize the connection between 3D and UI.
     */
    async init(onProgress?: (percent: number) => void): Promise<void> {
        // Step 1: Inject the #flow-content proxy so World's ScrollTrigger has a target
        this.injectScrollProxy();

        // Step 2: Initialize the World engine
        await this.world.setup(onProgress);

        // Step 3: Final sync is deferred to main.ts after all UI sections are mounted.
        // Calling refresh() here would measure an incomplete DOM — S1–S10 haven't mounted yet.
        // The authoritative refresh runs via activeSceneBridge?.handleResize() in the rAF callback.
    }

    /**
     * Creates a #flow-content div that acts as a scroll binding proxy for World.
     * The 3D scene's ScrollTrigger targets this ID.
     */
    private injectScrollProxy(): void {
        const existing = document.getElementById('flow-content');
        if (existing) return;

        const proxy = document.createElement('div');
        proxy.id = 'flow-content';
        proxy.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            pointer-events: none;
            z-index: -999;
            opacity: 0;
        `;

        const app = document.getElementById('app');
        if (app) {
            proxy.style.height = `${app.scrollHeight}px`;
        } else {
            proxy.style.height = '1000vh';
        }

        document.body.insertBefore(proxy, document.body.firstChild);
    }

    /**
     * Refreshes the scroll sync. Should be called after UI layout changes.
     */
    public refresh(): void {
        const proxy = document.getElementById('flow-content');
        const app = document.getElementById('app');

        if (proxy && app) {
            proxy.style.height = `${app.scrollHeight}px`;
            ScrollTrigger.refresh();
        }
    }

    /**
     * Passthrough for resize events
     */
    public handleResize(): void {
        this.refresh();
    }

    /**
     * Access the World instance if direct interaction is needed
     * (Use sparingly to maintain decoupling)
     */
    public getWorld(): World {
        return this.world;
    }

    /**
     * Cleanup resources for HMR
     */
    public destroy(): void {
        this.world.destroy();
        const proxy = document.getElementById('flow-content');
        if (proxy) proxy.remove();
    }
}
