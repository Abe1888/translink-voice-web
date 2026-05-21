/**
 * Core Scene Initialization
 *
 * Centralized setup for the Three.js logical root scene.
 * Fog has been removed per user request.
 */
import * as THREE from 'three';

export function createBaseScene(): THREE.Scene {
    const scene = new THREE.Scene();

    // Fog has been completely removed per user request
    scene.fog = null;

    return scene;
}
