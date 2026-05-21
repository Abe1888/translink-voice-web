/**
 * Material Applicator Utility
 *
 * Applies material configurations to loaded 3D models
 */

import * as THREE from 'three';
import materialConfigData from '../../translinkconfig/mesh_material_config.json';

const materialsConfig = materialConfigData.materials as Record<string, any>;

export function applyMaterials(model: THREE.Group): void {
    model.traverse((child: THREE.Object3D) => {
        if (!(child as THREE.Mesh).isMesh) return;

        const mesh = child as THREE.Mesh;
        const name = mesh.name;

        let materialConfig: any | null = null;

        // Apply material based on mesh name
        switch (name) {
            case 'Bolt_01':
            case 'Bolt_02':
            case 'Bolt_03':
            case 'Bolt_04':
                materialConfig = materialsConfig.bolt;
                break;
            case 'Fuel_Head':
                materialConfig = materialsConfig.fuelHead;
                break;
            case 'Fuel_Head_cover':
                materialConfig = materialsConfig.fuelHeadCover;
                break;
            case 'Text_Translink_pro':
            case 'Logo_Translink_pro':
                materialConfig = materialsConfig.brandLogo;
                break;
            case 'Harness':
                materialConfig = materialsConfig.harness;
                break;
            case 'Prob':
                materialConfig = materialsConfig.prob;
                break;
            case 'Base':
                materialConfig = materialsConfig.base;
                break;
            case 'Filter':
                materialConfig = materialsConfig.filter;
                break;
            case 'Fuel_tank':
                materialConfig = materialsConfig.fuelTank;
                break;
            case 'Belt':
                materialConfig = materialsConfig.belt;
                break;
            case 'light':
                materialConfig = materialsConfig.light;
                break;
            case 'virtual_studio':
                materialConfig = materialsConfig.virtualStudio;
                break;
            case 'Truck':
            case 'Cab_door':
            case 'Cab_Door_glass_frame':
                materialConfig = materialsConfig.truckBody;
                break;
            case 'Cab_Glass':
            case 'Cab_door_glass':
                materialConfig = materialsConfig.truckGlass;
                break;
            case 'Truck_Lights':
                materialConfig = materialsConfig.truckLights;
                break;
            case 'axle001_Front_wheel_Left':
            case 'axle001_Front_wheel_Right':
            case 'axle002_wheel_Both_Left_Right':
            case 'axle003_wheel_Both_Left_Right':
                // Check if name contains 'wheel' part for tire vs hub?
                // For simplicity, using truckTires for these
                materialConfig = materialsConfig.truckTires;
                break;
            case 'Ground_point':
            case 'Wall_point':
            case 'virtual_studio_Ground_Spline_Circle_collisions':
                mesh.visible = false;
                return;
            default:
                if (
                    name.includes('_3D_point') ||
                    name.includes('_Ref_Point') ||
                    name.toLowerCase().includes('guide') ||
                    name.toLowerCase().includes('marker') ||
                    name.toLowerCase().includes('point')
                ) {
                    mesh.visible = false;
                    return;
                }
                break;
        }

        if (materialConfig) {
            const props = { ...materialConfig };

            // Handle hex strings from JSON
            if (typeof props.color === 'string' && props.color.startsWith('#')) {
                props.color = new THREE.Color(props.color);
            }

            if (typeof props.emissive === 'string' && props.emissive.startsWith('#')) {
                props.emissive = new THREE.Color(props.emissive);
            }

            const material = new THREE.MeshPhysicalMaterial(props);

            if (name === 'virtual_studio') {
                material.side = THREE.DoubleSide;
            }

            mesh.material = material;
            mesh.material.needsUpdate = true;
        }

        // mesh.visible = true; // RECOVERY: Let World.ts handle authoritative visibility
        mesh.frustumCulled = false;
        // All real-geometry meshes both cast AND receive shadows so inter-component
        // self-shadowing works throughout S1-S10. virtual_studio is the only mesh
        // excluded from casting (it is a backdrop, not an object).
        mesh.castShadow = name !== 'virtual_studio';
        mesh.receiveShadow = true; // was: name === 'virtual_studio' — blocked all self-shadowing
    });
}
