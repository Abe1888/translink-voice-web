/**
 * Model Loader Utility
 *
 * Loads both split GLB assets and merges them into one scene group.
 * Replaces the deprecated translink_sense_meshopt.glb (single merged file).
 *
 * Assets:
 *   sensor_assembly_meshopt.glb - sensor components, fuel tank, branding
 *   truck_assembly_meshopt.glb  - truck cab, axles, fuel tank indicator
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { ASSET_PATHS } from '../../translinkconfig/paths';

export interface LoaderCallbacks {
    onProgress?: (percent: number) => void;
    onError?: (error: Error) => void;
}

export function createModelLoader(): GLTFLoader {
    const gltfLoader = new GLTFLoader();
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    return gltfLoader;
}

function loadSingle(
    loader: GLTFLoader,
    path: string,
    onProgress?: (percent: number) => void
): Promise<GLTF> {
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            resolve,
            (progress: any) => {
                if (onProgress && progress.total > 0) {
                    onProgress((progress.loaded / progress.total) * 100);
                }
            },
            (error: any) => reject(error instanceof Error ? error : new Error(String(error)))
        );
    });
}

/**
 * Load both split GLB assets and merge into a single root Group.
 * The returned group is traversed by Scene3DController to build meshCache -
 * all mesh names remain identical to those in the deprecated monolithic GLB.
 */
export function loadModel(
    loader: GLTFLoader,
    callbacks: LoaderCallbacks = {}
): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        Promise.all([
            loadSingle(loader, ASSET_PATHS.models.sensor, callbacks.onProgress),
            loadSingle(loader, ASSET_PATHS.models.truck, callbacks.onProgress),
        ])
            .then(([sensorGltf, truckGltf]) => {
                // Merge both scenes into one root so the controller can traverse
                // all meshes as if they came from a single file.
                const root = new THREE.Group();
                root.position.set(0, 0, 0);
                root.rotation.set(0, 0, 0);
                root.scale.set(1, 1, 1);

                sensorGltf.scene.position.set(0, 0, 0);
                truckGltf.scene.position.set(0, 0, 0);

                // Remove duplicate meshes from truckGltf to prevent z-fighting
                // and ensure Scene3DController's meshCache grabs a single authoritative mesh.
                // Fuel_tank, Belt, and light exist in both assets with identical transforms.
                const duplicatesToRemove = ['Fuel_tank', 'Belt', 'light'];
                const toRemove: THREE.Object3D[] = [];

                truckGltf.scene.traverse((child: any) => {
                    if (duplicatesToRemove.includes(child.name)) {
                        toRemove.push(child);
                    }
                });

                toRemove.forEach((child) => {
                    if (child.parent) {
                        child.parent.remove(child);
                    }
                });

                root.add(sensorGltf.scene);
                root.add(truckGltf.scene);

                resolve(root);
            })
            .catch((error) => {
                const err = error instanceof Error ? error : new Error(String(error));
                if (callbacks.onError) callbacks.onError(err);
                reject(err);
            });
    });
}
