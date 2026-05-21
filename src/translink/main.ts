/**
 * STRICT RESPONSIVE LAYOUT RULE:
 * No disruptive changes are allowed to the responsive layout. All updates must
 * preserve existing structure, behavior, and visual consistency without breaking the layout flow.
 */

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TranslinkS1Controller } from './translinkS1/controllers/TranslinkS1Controller';
import { TranslinkS2Controller } from './translinkS2/controllers/TranslinkS2Controller';
import { TranslinkS3Controller } from './translinkS3/controllers/TranslinkS3Controller';
import { TranslinkS4Controller } from './translinkS4/controllers/TranslinkS4Controller';
import { TranslinkS5Controller } from './translinkS5/controllers/TranslinkS5Controller';
import { TranslinkS6Controller } from './translinkS6/controllers/TranslinkS6Controller';
import { TranslinkS7Controller } from './translinkS7/controllers/TranslinkS7Controller';
import { TranslinkS8Controller } from './translinkS8/controllers/TranslinkS8Controller';
import { TranslinkS9Controller } from './translinkS9/controllers/TranslinkS9Controller';
import { TranslinkS10Controller } from './translinkS10/controllers/TranslinkS10Controller';
import { GlobalNavIndicator } from './components/GlobalNavIndicator';
import { TranslinkSVGMorphingLogo } from './components/TranslinkSVGMorphingLogo';
import { TranslinkLogoAnimator } from './controllers/TranslinkLogoAnimator';
import { TranslinkLiveFeedController } from './controllers/TranslinkLiveFeedController';
import { scrollSystem } from './controllers/TranslinkScrollSystem';
import { TranslinkVerticalTitleAnimator } from './controllers/TranslinkVerticalTitleAnimator';
import { interactionSystem } from './controllers/TranslinkInteractionSystem';
import { TranslinkSoundToggle } from './components/TranslinkSoundToggle';
import { TranslinkCustomCursor } from './components/TranslinkCustomCursor';
import { TranslinkLanguageToggle } from './components/TranslinkLanguageToggle';
import { TranslinkCursorController } from './controllers/TranslinkCursorController';
import { TranslinkGlobalDecorations } from './components/TranslinkGlobalDecorations';
import { TranslinkClientLogoScroll } from './components/TranslinkClientLogoScroll';

// TranslinkWorldAdapter bridges World's #flow-content scroll binding
// into our #app-based translink architecture.
// It injects a proxy #flow-content div so World's ScrollTrigger and
// the waypoint SceneBridge system sync correctly with our scroll container.
import { SceneBridge } from '../translinkbridge/SceneBridge';
import { TranslinkWatermarkEngine } from './utils/TranslinkWatermarkEngine';

import gsap from 'gsap';

gsap.registerPlugin(ScrollTrigger);

import { TranslinkRobotLoader } from './components/TranslinkRobotLoader';

let activeSceneBridge: SceneBridge | null = null;

async function init() {
    // ── Step 0: Global Cleanup & Loader ──────────────────────────────────────────
    const app = document.getElementById('app');
    if (!app) return;

    // Initialize and mount the Robot Loader immediately
    const loader = new TranslinkRobotLoader();
    loader.mount();

    // Destroy existing systems to prevent memory leaks and background loops
    if (activeSceneBridge) {
        activeSceneBridge.destroy();
        activeSceneBridge = null;
    }

    // Destroy existing scroll triggers and clear DOM to prevent memory leaks
    ScrollTrigger.getAll().forEach((t) => t.kill());
    scrollSystem.destroy();
    app.innerHTML = '';

    // ── Step 1: Boot the 3D World Scene via SceneBridge ──────────────────────────
    activeSceneBridge = new SceneBridge();
    try {
        await activeSceneBridge.init((percent) => {
            loader.update(percent);
        });
    } catch (err) {
        console.warn('[Translink] SceneBridge initialization failed:', err);
    }

    // ── Step 2: Mount all HUD section layers ──────────────────────────────────
    // All sections sit above the 3D scene via z-index: var(--z-section-container)
    new TranslinkS1Controller().mount(app);
    new TranslinkS2Controller().mount(app);
    new TranslinkS3Controller().mount(app);
    new TranslinkS4Controller().mount(app);
    new TranslinkS5Controller().mount(app);
    new TranslinkS6Controller().mount(app);
    new TranslinkS7Controller().mount(app);
    new TranslinkS8Controller().mount(app);
    new TranslinkS9Controller().mount(app);
    new TranslinkS10Controller().mount(app);

    // Loop structural requirement: Create an S1 physical clone at the bottom of the map
    const cloneWrapper = document.createElement('div');
    cloneWrapper.id = 's1-clone';
    new TranslinkS1Controller().mount(cloneWrapper);
    app.appendChild(cloneWrapper);

    // ── Step 3: Boot Smooth Scrolling / Infinite Loop Array ───────────────────
    scrollSystem.initLenis();

    // ── Step 4: Mount Global HUD Elements ─────────────────────────────────────
    new GlobalNavIndicator().mount(app);
    TranslinkGlobalDecorations.mount(app);
    new TranslinkSVGMorphingLogo().mount(app);
    new TranslinkSoundToggle().mount(app);
    new TranslinkLanguageToggle().mount(app);
    new TranslinkClientLogoScroll().mount(app);
    new TranslinkCustomCursor().mount();

    // ── Step 5: Initialize GSAP animation pipeline after full layout render ───
    // Use document.fonts.ready + rAF instead of a brittle 500ms timeout.
    // This strictly ensures web fonts are loaded and layout is paint-committed
    // before GSAP initializes, guaranteeing accurate ScrollTrigger measurements.
    document.fonts.ready.then(() => {
        requestAnimationFrame(async () => {
            const logoAnimator = new TranslinkLogoAnimator();
            logoAnimator.setup();

            const titleAnimator = new TranslinkVerticalTitleAnimator();
            titleAnimator.setup();

            new TranslinkLiveFeedController();

            const cursorController = new TranslinkCursorController();
            cursorController.setup();

            // Setup global Parallax and 3D Tilt interactions
            interactionSystem.init();

            // Final sync: refresh SceneBridge after GSAP pipeline is ready
            // handleResize() already calls ScrollTrigger.refresh() internally.
            activeSceneBridge?.handleResize();

            // Initialise the unified watermark engine
            TranslinkWatermarkEngine.init();

            // ── Resize handler (debounced at 150ms to match World.ts's internal debounce) ──
            // handleResize() already calls ScrollTrigger.refresh() — no duplicate call needed.
            let resizeTimer: ReturnType<typeof setTimeout> | null = null;
            window.addEventListener(
                'resize',
                () => {
                    if (resizeTimer !== null) clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        activeSceneBridge?.handleResize();
                        resizeTimer = null;
                    }, 150);
                },
                { passive: true }
            );
            // Finalize: hide the robot loader before mounting the Robot/Voice layer.
            // This preserves the production loading contract: no Robot, voice engine,
            // microphone, socket, or AI session initializes during 3D asset loading.
            await loader.hide();

            // ── Global Easter Egg Companion ────────────────────────────────
            // Mount the singleton LAST so it sits above all other layers.
            // All section TelemetryButtons share this single instance and
            // call carryButton() / returnHome() on it via ScrollTrigger.
            const { TranslinkEasterEggFriend } = await import('./components/TranslinkEasterEggFriend');
            TranslinkEasterEggFriend.reset(); // Clear any stale instance from HMR
            TranslinkEasterEggFriend.getInstance().mount(document.body);
        });
    });
}

init();
