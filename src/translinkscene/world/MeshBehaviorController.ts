import * as THREE from 'three';
import behaviorConfigData from '../../translinkconfig/mesh_behavior_config.json';

export interface MeshBehavior {
    wireframe?: boolean;
    transparent?: boolean;
    opacity?: number;
    visible?: boolean | null;
    castShadow?: boolean;
    receiveShadow?: boolean;
    overrideAnimation?: boolean; // If true, prevents World.ts from changing it
    threshold?: number; // Geometric threshold for EdgesGeometry
}

export interface MeshBehaviorConfig {
    defaults: MeshBehavior;
    meshes: Record<string, MeshBehavior>;
}

export class MeshBehaviorController {
    private config: MeshBehaviorConfig;

    constructor() {
        this.config = behaviorConfigData as MeshBehaviorConfig;
    }

    /**
     * Update the internal config with new data (for realtime updates/HMR)
     */
    public updateConfig(newConfig: MeshBehaviorConfig): void {
        this.config = newConfig;
    }

    /**
     * Apply the central behavior configuration to the entire model
     */
    public applyConfig(model: THREE.Group): void {
        const defaults = this.config.defaults || {};

        model.traverse((child: THREE.Object3D) => {
            if (!(child as THREE.Mesh).isMesh) return;

            const mesh = child as THREE.Mesh;
            const name = mesh.name;

            // Only apply defaults safely (don't override existing loaded material properties unnecessarily),
            // but definitely apply specific mesh config overrides
            const meshConfig = this.config.meshes[name];

            if (!meshConfig && !defaults) return;

            const behavior: MeshBehavior = { ...meshConfig };

            this.applyBehaviorToMesh(mesh, behavior, defaults);
        });
    }

    private applyBehaviorToMesh(
        mesh: THREE.Mesh,
        behavior: MeshBehavior,
        defaults: MeshBehavior
    ): void {
        // Resolve values against defaults
        const wireframe =
            behavior.wireframe !== undefined ? behavior.wireframe : defaults.wireframe;
        const transparent =
            behavior.transparent !== undefined ? behavior.transparent : defaults.transparent;
        const opacity = behavior.opacity !== undefined ? behavior.opacity : defaults.opacity;
        const castShadow =
            behavior.castShadow !== undefined ? behavior.castShadow : defaults.castShadow;
        const receiveShadow =
            behavior.receiveShadow !== undefined ? behavior.receiveShadow : defaults.receiveShadow;

        // Apply visibility
        if (behavior.visible !== undefined && behavior.visible !== null) {
            mesh.visible = behavior.visible;
        }

        // Apply shadow if specified
        if (castShadow !== undefined) {
            mesh.castShadow = castShadow;
        }
        if (receiveShadow !== undefined) {
            mesh.receiveShadow = receiveShadow;
        }

        // Apply material properties
        if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

            materials.forEach((mat) => {
                let needsUpdate = false;

                if (wireframe !== undefined && 'wireframe' in mat) {
                    (mat as any).wireframe = wireframe;
                    needsUpdate = true;
                }

                if (transparent !== undefined) {
                    mat.transparent = transparent;
                    needsUpdate = true;
                }

                if (opacity !== undefined && opacity !== null) {
                    mat.opacity = opacity;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    mat.needsUpdate = true;
                }
            });
        }
    }

    /**
     * Checks if the mesh's behavior config dictates it should override scroll animations.
     */
    public shouldOverrideAnimation(meshName: string): boolean {
        return !!this.config.meshes[meshName]?.overrideAnimation;
    }

    /**
     * Gets the target forced visibility state if override is enabled.
     */
    public getOverriddenVisibility(meshName: string): boolean | null | undefined {
        return this.config.meshes[meshName]?.visible;
    }

    /**
     * Gets the geometric threshold for a mesh (with global default fallback)
     */
    public getThreshold(meshName: string): number {
        return this.config.meshes[meshName]?.threshold ?? this.config.defaults.threshold ?? 15;
    }
}
