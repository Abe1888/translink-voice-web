/**
 * Lighting Setup Utility
 *
 * Creates and configures the 6-light studio rig.
 * HARDCODED: No dependency on external JSON configuration.
 */

import * as THREE from 'three';

export interface LightingRig {
    ambient: THREE.AmbientLight;
    hemisphere: THREE.HemisphereLight;
    keyLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
    backLight: THREE.DirectionalLight;
    topLight: THREE.DirectionalLight;
    accentLights?: THREE.PointLight[];
}

function getShadowMapSize(): [number, number] {
    if (typeof window === 'undefined') return [2048, 2048];
    const pixelRatio = window.devicePixelRatio || 1;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) return [1024, 1024];
    if (window.screen.width * pixelRatio >= 3840) return [4096, 4096];
    return [2048, 2048];
}

export function setupLighting(scene: THREE.Scene, camera?: THREE.Camera): LightingRig {
    const shadowMapSize = getShadowMapSize();

    const addLight = (light: THREE.Object3D, isDynamic?: boolean) => {
        if (isDynamic && camera) {
            camera.add(light);
        } else {
            scene.add(light);
        }
    };

    // 1. Ambient Light
    const ambient = new THREE.AmbientLight('#f5f1e8', 0.2);
    addLight(ambient, false);

    // 2. Hemisphere Light
    const hemisphere = new THREE.HemisphereLight('#ffffff', '#161616', 0.2);
    addLight(hemisphere, false);

    // 3. Key Light (with shadows)
    const keyLight = new THREE.DirectionalLight('#fff1e0', 1.15);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = shadowMapSize[0];
    keyLight.shadow.mapSize.height = shadowMapSize[1];
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.05;
    keyLight.shadow.radius = 5;
    addLight(keyLight, false);

    // 4. Fill Light
    const fillLight = new THREE.DirectionalLight('#d9e6ff', 0.35);
    fillLight.position.set(-6, 4, 3);
    addLight(fillLight, true);

    // 5. Back Light (RIM)
    const backLight = new THREE.DirectionalLight('#c0202f', 0.25);
    backLight.position.set(0, 3, -6);
    addLight(backLight, true);

    // 6. Top Light
    const topLight = new THREE.DirectionalLight('#ffffff', 0.08);
    topLight.position.set(0, 10, 0);
    addLight(topLight, true);

    return {
        ambient,
        hemisphere,
        keyLight,
        fillLight,
        backLight,
        topLight,
        accentLights: [],
    };
}
