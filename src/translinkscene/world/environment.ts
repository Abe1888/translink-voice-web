/**
 * HDR Environment Loader
 *
 * Loads and processes HDR environment maps with optional compression support
 * Resolves G-03: No texture compression
 */

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { ASSET_PATHS } from '../../translinkconfig/paths';

export interface HDRLoaderOptions {
    /** Use compressed EXR if available */
    preferCompressed?: boolean;
    /** Custom HDR path override */
    hdrPath?: string;
    /** PMREM quality (default: 256) */
    pmremResolution?: number;
}

/**
 * Check if browser supports compressed textures
 */
function getCompressedTextureSupport(renderer: THREE.WebGLRenderer): {
    astc: boolean;
    etc2: boolean;
    s3tc: boolean;
    pvrtc: boolean;
} {
    const gl = renderer.getContext();

    return {
        astc: !!gl.getExtension('WEBGL_compressed_texture_astc'),
        etc2: !!gl.getExtension('WEBGL_compressed_texture_etc'),
        s3tc: !!gl.getExtension('WEBGL_compressed_texture_s3tc'),
        pvrtc: !!gl.getExtension('WEBGL_compressed_texture_pvrtc'),
    };
}

/**
 * Get optimal HDR path based on device capabilities
 */
function getOptimalHDRPath(
    renderer: THREE.WebGLRenderer,
    basePath: string,
    preferCompressed: boolean
): string {
    if (!preferCompressed) return basePath;

    const support = getCompressedTextureSupport(renderer);
    const pathWithoutExt = basePath.replace(/\.(hdr|exr)$/i, '');

    // Check for pre-compressed variants (would need to be generated offline)
    // Priority: ASTC (mobile) > ETC2 (mobile) > S3TC (desktop) > Original
    if (support.astc) {
        return `${pathWithoutExt}.astc.ktx2`;
    }
    if (support.etc2) {
        return `${pathWithoutExt}.etc2.ktx2`;
    }
    if (support.s3tc) {
        return `${pathWithoutExt}.s3tc.ktx2`;
    }

    // Fallback to original HDR
    return basePath;
}

export function loadHDREnvironment(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    options: HDRLoaderOptions = {}
): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        const {
            preferCompressed = false,
            hdrPath = ASSET_PATHS.hdr.studio,
            // pmremResolution - reserved for future PMREM quality tuning
        } = options;
        void options.pmremResolution; // Acknowledge optional param

        const finalPath = getOptimalHDRPath(renderer, hdrPath, preferCompressed);
        const isKTX2 = finalPath.endsWith('.ktx2');

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        if (isKTX2) {
            // KTX2 compressed texture loading
            import('three/addons/loaders/KTX2Loader.js')
                .then(({ KTX2Loader }) => {
                    const ktx2Loader = new KTX2Loader();
                    ktx2Loader.setTranscoderPath('/assets/basis/');
                    ktx2Loader.detectSupport(renderer);

                    ktx2Loader.load(
                        finalPath,
                        (texture) => {
                            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                            scene.environment = envMap;

                            texture.dispose();
                            pmremGenerator.dispose();
                            ktx2Loader.dispose();

                            resolve(envMap);
                        },
                        undefined,
                        () => {
                            // Fallback to original HDR if compressed fails
                            console.warn('Compressed HDR failed, falling back to original');
                            loadOriginalHDR(
                                hdrPath,
                                renderer,
                                scene,
                                pmremGenerator,
                                resolve,
                                reject
                            );
                        }
                    );
                })
                .catch(() => {
                    // KTX2Loader not available, use original
                    loadOriginalHDR(hdrPath, renderer, scene, pmremGenerator, resolve, reject);
                });
        } else {
            loadOriginalHDR(finalPath, renderer, scene, pmremGenerator, resolve, reject);
        }
    });
}

function loadOriginalHDR(
    path: string,
    _renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    pmremGenerator: THREE.PMREMGenerator,
    resolve: (texture: THREE.Texture) => void,
    reject: (error: unknown) => void
): void {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.setDataType(THREE.HalfFloatType);

    rgbeLoader.load(
        path,
        (hdrTexture: any) => {
            const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
            scene.environment = envMap;

            hdrTexture.dispose();
            pmremGenerator.dispose();

            resolve(envMap);
        },
        undefined,
        (error: any) => {
            reject(error);
        }
    );
}
