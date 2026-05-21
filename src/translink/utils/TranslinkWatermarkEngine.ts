import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * TranslinkWatermarkEngine
 *
 * Single, authoritative system for all background section-number watermark animations
 * (S2–S10). Called once from main.ts after all sections are mounted.
 *
 * Specification (scroll.md — Source of Truth):
 *   Each section's watermark runs a 5-phase scrubbed timeline (100 total units),
 *   triggered from `start: "top top"` to `end: "bottom top"` on the section element.
 *
 *   Phase 1 — Hidden  : 0–26 units   (off-screen right,  x: 100vw)
 *   Phase 2 — Enter   : 26–36 units  (ease in from right, power2.out)
 *   Phase 3 — Hold    : 36–44 units  (centered,           x: 0vw)
 *   Phase 4 — Exit    : 44–54 units  (ease out to right,  power2.in)
 *   Phase 5 — Hidden  : 54–100 units (off-screen right,  x: 100vw)
 *
 * This maps correctly for ALL section heights (100dvh, 400dvh, 200dvh) because
 * the GSAP duration values are proportional weights within the scrubbed timeline,
 * not absolute time — ScrollTrigger normalises them over the full scroll distance.
 *
 * Global visibility windows (from scroll.md):
 *   S2  →  enters 9.0%,  exits 11.0%
 *   S3  →  enters 16.1%, exits 18.1%
 *   S4  →  enters 23.3%, exits 25.3%
 *   S5  →  enters 36.0%, exits 44.0%   (400dvh section)
 *   S6  →  enters 59.0%, exits 61.0%
 *   S7  →  enters 66.1%, exits 68.1%
 *   S8  →  enters 73.3%, exits 75.3%
 *   S9  →  enters 80.4%, exits 82.4%
 *   S10 →  enters 89.4%, exits 93.4%   (200dvh section)
 */
export class TranslinkWatermarkEngine {
    /** Tracks all created ScrollTriggers for safe cleanup */
    private static triggers: ScrollTrigger[] = [];

    /**
     * Initialise all watermark animations. Call once after DOM mount.
     */
    static init(): void {
        /* Kill any prior instances to allow safe HMR re-init */
        this.destroy();

        const sectionIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];

        sectionIds.forEach((id) => this.registerWatermark(id));
    }

    /**
     * Register the scrubbed 5-phase watermark animation for one section.
     * @param sectionId  The bare section id, e.g. 's2'
     */
    private static registerWatermark(sectionId: string): void {
        /* Resolve section element */
        const section = document.getElementById(sectionId);
        if (!section) {
            console.warn(`[TranslinkWatermarkEngine] Section #${sectionId} not found — skipping.`);
            return;
        }

        /* Resolve the background-number element globally since they are now in the Global Decorations layer */
        const num = document.getElementById(`${sectionId}-num`);
        if (!num) {
            /* Some sections intentionally have no bg-number; skip silently */
            return;
        }

        /* Clean up any pre-existing ScrollTrigger for this element */
        const stId = `watermark-${sectionId}`;
        ScrollTrigger.getById(stId)?.kill();

        /*
         * Initial state: watermark is off-screen to the right.
         * xPercent/yPercent centre the element on its own axis;
         * x then offsets it by 100vw from that centred position.
         * This matches the CSS class `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
         * already applied by TranslinkSectionDecorations, so we preserve that centring.
         */
        const isHero = sectionId === 's1';

        /*
         * Initial state:
         * Hero (S1) starts centred (0vw) so it's visible on load.
         * Others start off-screen right (100vw).
         */
        gsap.set(num, {
            xPercent: -50,
            yPercent: -50,
            x: isHero ? '0vw' : '100vw',
            force3D: true,
        });

        const tl = gsap.timeline({
            scrollTrigger: {
                id: stId,
                trigger: section,
                start: isHero ? 'top top' : 'top 70%',
                end: isHero ? 'bottom top' : 'top 20%',
                scrub: 2,
                invalidateOnRefresh: true,
            },
        });

        if (isHero) {
            tl
                /* Hero: Hold centred for the first half of the section */
                .to(num, { x: '0vw', duration: 50, ease: 'none' })
                /* Then slow slide out as we leave the hero */
                .to(num, { x: '100vw', duration: 45, ease: 'sine.inOut' })
                .to(num, { x: '100vw', duration: 5, ease: 'none' });
        } else {
            tl
                /* Standard: 5-phase centred on section middle */
                .to(num, { x: '100vw', duration: 5, ease: 'none' })
                .to(num, { x: '0vw', duration: 40, ease: 'sine.inOut' })
                .to(num, { x: '100vw', duration: 40, ease: 'sine.inOut', delay: 10 }) // Combined hold+exit
                .to(num, { x: '100vw', duration: 5, ease: 'none' });
        }

        /* Store the ScrollTrigger reference for later cleanup */
        if (tl.scrollTrigger) {
            this.triggers.push(tl.scrollTrigger);
        }
    }

    /**
     * Kill all watermark ScrollTriggers. Safe to call before re-init.
     */
    static destroy(): void {
        this.triggers.forEach((st) => st.kill());
        this.triggers = [];
    }
}
