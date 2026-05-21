/**
 * Translink Flow Configuration
 *
 * Centralized configuration for all animation settings,
 * colors, timing, and behavior.
 */

export const FLOW_CONFIG = {
    // Lenis smooth scroll settings
    lenis: {
        duration: 1.5,
        smoothWheel: true,
        syncTouch: true,
    },

    // Background colors - Hardcoded for performance and simplicity
    colors: {
        dark: '#161616',
        crimson: '#c0202f',
        darkRed: '#c0202f',
        white: '#ffffff',
        accent: '#c0202f',
        accentRed: '#c0202f',
        cream: '#f5f1e8',
        darkText: '#161616',
    },

    // Animation easings (GSAP)
    easings: {
        power4Out: 'power4.out',
        power4In: 'power4.in',
        power3Out: 'power3.out',
        power2Out: 'power2.out',
        expoOut: 'expo.out',
        expoInOut: 'expo.inOut',
    },

    // Animation timing
    timing: {
        fast: 0.4,
        medium: 0.6,
        slow: 0.8,
        verySlow: 1.2,
        staggerFast: 0.05,
        staggerMedium: 0.1,
        staggerSlow: 0.2,
    },

    // Parallax speeds
    parallax: {
        verySlowPositive: 0.02,
        slowPositive: 0.03,
        mediumPositive: 0.05,
        fastPositive: 0.08,
        veryFastPositive: 0.1,
        verySlowNegative: -0.02,
        slowNegative: -0.03,
        mediumNegative: -0.05,
    },

    // Section IDs - manually kept in sync with assets/config/section_ui_config.json
    // ! SOURCE OF TRUTH: section_ui_config.json (10 sections: s1-s10)
    // For runtime access, prefer SectionConfigLoader.getSectionIds() which reads from JSON.
    sections: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'],

    // Section Names - manually kept in sync with assets/config/section_ui_config.json
    // ! SOURCE OF TRUTH: section_ui_config.json (verticalTitle.label / title fields)
    // For runtime access, prefer SectionConfigLoader.getSectionNames() which reads from JSON.
    sectionNames: {
        s1: 'Translink Hero',
        s2: 'Translink Tracking',
        s3: 'Translink Fuel - Fuel Telematics',
        s4: 'Translink CAN - OBD - Analytics',
        s5: 'Translink Fleet - Tracking',
        s6: 'Translink Fleet - Analytics',
        s7: 'Translink Fleet - Precision',
        s8: 'Translink AI and Translink IOT',
        s9: 'Translink Vision - Video Telematics and AI (ADAS & DMS)',
        s10: 'Translink Contact',
    },

    // Background transition ranges (recalibrated for 1400dvh)
    backgroundTransitions: {
        // Black -> Red transition zone (S3 hand-off)
        blackToRed: {
            start: 0.0571,
            end: 0.0857,
            center: 0.0714,
        },
        // Red -> Cream transition zone (S6 start)
        redToCream: {
            start: 0.5714,
            end: 0.7143,
            center: 0.6429,
        },
        // Light mode text trigger
        lightModeStart: 0.5714,
        lightModeEnd: 0.7143,
    },

    // Loader settings
    loader: {
        minDuration: 1500,
        barAnimationDuration: 0.2,
        hideAnimationDuration: 1.2,
    },
} as const;

export type FlowConfig = typeof FLOW_CONFIG;
