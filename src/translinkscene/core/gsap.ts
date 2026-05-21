/**
 * GSAP Configuration - Tree-Shaken Build
 *
 * Centralized GSAP exports with only required plugins.
 * All modules should import from '@/translinkscene/core/gsap' instead of 'gsap' directly.
 */

import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register only required plugins (tree-shaking optimization)
// Phase 7 Optimization: ScrollTrigger registration is consolidated in main.ts
gsap.registerPlugin(CustomEase);

// Custom easing functions
export const easeMenu = CustomEase.create('custom', 'M0,0 C0.61,-0.01 0,1 1,1');
export const easePrimary = CustomEase.create('customEase', '0.6, 0.01, 0.05, 1');
export const easeDirectional = CustomEase.create('directionalEase', '0.16, 1, 0.3, 1');
export const easeBlur = CustomEase.create('smoothBlur', '0.25, 0.1, 0.25, 1');
export const easeGentleIn = CustomEase.create('gentleIn', '0.38, 0.005, 0.215, 1.1');
export const easeQuickSnap = CustomEase.create('quickSnap', '0.22, 1, 0.36, 1');
export const easeInstant = CustomEase.create('instantEase', '0.1, 0, 0, 1');
export const easeText = CustomEase.create('cssEase', '0.215, 0.61, 0.355, 1');

// Global configuration for production-clean DOM
gsap.config({
    force3D: false,
});

// Default settings
gsap.defaults({
    ease: 'expo.out',
    duration: 1.2,
});

// Re-export for centralized imports
export { gsap, ScrollTrigger, CustomEase };
export default gsap;
