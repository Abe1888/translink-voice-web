import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export interface ScrollHooks {
    onProgress?: (progress: number) => void;
    onToggle?: (isActive: boolean) => void;
    onEnter?: () => void;
    onLeave?: () => void;
    onEnterBack?: () => void;
    onLeaveBack?: () => void;
}

/**
 * Centrally manages unified scroll behaviors, transitions,
 * and animations for all responsive Translink layout sections.
 */
class TranslinkScrollSystem {
    private triggers: ScrollTrigger[] = [];
    private lenis: Lenis | null = null;

    initLenis(): void {
        if (this.lenis) return;

        const isMobile = window.innerWidth < 768;
        this.lenis = new Lenis({
            duration: isMobile ? 1.5 : 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            touchMultiplier: isMobile ? 1.2 : 2,
            syncTouch: true,
            infinite: true, // Enables the seamless vertical looping
        });

        this.lenis.on('scroll', () => {
            // Only update triggers, don't refresh here as it's expensive
            ScrollTrigger.update();
        });

        gsap.ticker.add((time) => {
            this.lenis?.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
        // NOTE: Periodic setInterval(ScrollTrigger.refresh, 5000) removed.
        // Authoritative refresh runs in main.ts via activeSceneBridge?.handleResize()
        // after document.fonts.ready + rAF, and again on window resize (debounced 150ms).
    }

    /**
     * Registers a structural component into the scroll observation grid
     * @param element The DOM boundary measuring the scroll offset mapping
     * @param hooks Callback actions to run at specific lifecycle milestones
     * @param options Additional GSAP ScrollTrigger boundaries
     */
    registerScrollNode(
        element: HTMLElement,
        hooks: ScrollHooks,
        options: Partial<ScrollTrigger.Vars> = {}
    ): void {
        const trigger = ScrollTrigger.create({
            trigger: element,
            start: options.start || 'top top',
            end: options.end || 'bottom top',
            scrub: options.scrub !== undefined ? options.scrub : true,
            onUpdate: (self) => {
                if (hooks.onProgress) hooks.onProgress(self.progress);
            },
            onToggle: (self) => {
                if (hooks.onToggle) hooks.onToggle(self.isActive);
            },
            onEnter: () => {
                if (hooks.onEnter) hooks.onEnter();
            },
            onLeave: () => {
                if (hooks.onLeave) hooks.onLeave();
            },
            onEnterBack: () => {
                if (hooks.onEnterBack) hooks.onEnterBack();
            },
            onLeaveBack: () => {
                if (hooks.onLeaveBack) hooks.onLeaveBack();
            },
            ...options,
        });

        this.triggers.push(trigger);
    }

    /**
     * Creates an animated transition context localized cleanly to a section
     * without leaking tween data globally across modules.
     */
    registerAnimation(
        element: HTMLElement,
        animationFn: (tl: gsap.core.Timeline) => void,
        options: Partial<ScrollTrigger.Vars> = {}
    ): void {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: element,
                start: options.start || 'top center',
                end: options.end || 'bottom center',
                toggleActions: options.toggleActions || 'play reverse play reverse',
                ...options,
            },
        });

        animationFn(tl);
    }

    /**
     * Safely destroy instances removing GSAP trackers and scrubbing handlers entirely
     */
    destroy(): void {
        this.triggers.forEach((t) => t.kill());
        this.triggers = [];
    }
}

// Maintain a single continuous layout singleton
export const scrollSystem = new TranslinkScrollSystem();
