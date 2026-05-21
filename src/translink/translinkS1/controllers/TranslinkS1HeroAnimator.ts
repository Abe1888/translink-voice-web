import gsap from 'gsap';
import { TranslinkLanguageController } from '../../controllers/TranslinkLanguageController';

/**
 * TranslinkS1HeroAnimator
 *
 * Handles the S1 hero entrance typewriter sequence and the scroll-away fade.
 *
 * Jump Fix (root cause):
 *   Previously, `boundary.querySelector('.flex-1.flex.flex-col')` was used as the
 *   ScrollTrigger trigger where `boundary` = the entire #app element. This caused:
 *     1. The trigger to resolve to a non-S1 element (first match anywhere in #app).
 *     2. With Lenis `infinite: true`, scroll-position wrapping caused scrub jumps.
 *     3. The clone instance duplicated triggers on the same DOM element.
 *
 *   Fix: Use `document.getElementById('s1')` as the authoritative trigger, add
 *   `invalidateOnRefresh: true`, and guard against running the scroll-fade on the
 *   clone (which must not create its own duplicate ScrollTrigger).
 */
export class TranslinkS1HeroAnimator {
    setup(boundary: HTMLElement): void {
        /*
         * Determine whether this instance is animating the real S1 section or the
         * infinite-loop structural clone (#s1-clone). The clone must NOT register a
         * new ScrollTrigger because the real #s1 already owns it, and a duplicate
         * would cause a jump when Lenis wraps the scroll position.
         */
        const isClone = boundary.id === 's1-clone' || boundary.closest('#s1-clone') !== null;

        /* ── Typewriter Entrance Sequence ──────────────────────────────────────── */
        const part1 = boundary.querySelector<Element>('.s1-part1');
        const part2 = boundary.querySelector<Element>('.s1-part2');
        const part3 = boundary.querySelector<Element>('.s1-part3');
        const sub = boundary.querySelector<Element>('.s1-anim-subheadline');
        const trust = boundary.querySelector<Element>('.s1-anim-trust');

        /* Typewriter configuration from Translation Engine */
        const lang = TranslinkLanguageController.getInstance();
        const headlinePart1 = lang.t('sections.s1.hero_part1');
        const headlinePart2 = lang.t('sections.s1.hero_part2');
        const headlinePart3 = lang.t('sections.s1.hero_part3');
        const subheadlineText = lang.t('sections.s1.hero_description');

        /* If this is the clone, set text instantly to ensure visual continuity during wrap */
        if (isClone && part1 && part2 && part3 && sub) {
            part1.textContent = headlinePart1;
            part2.textContent = headlinePart2;
            part3.textContent = headlinePart3;
            sub.textContent = subheadlineText;
            if (trust) gsap.set(trust, { opacity: 1, y: 0 });
        }

        /* Only run the typewriter on the real S1, not the clone (avoids double-typing) */
        if (!isClone && part1 && part2 && part3 && sub) {
            /* Clear initial states for safe re-initialization */
            part1.textContent = '';
            part2.textContent = '';
            part3.textContent = '';
            sub.textContent = '';

            const typeWriter = (
                element: Element,
                text: string,
                speed: number,
                callback?: () => void
            ): void => {
                let i = 0;
                const type = (): void => {
                    if (i < text.length) {
                        element.textContent += text.charAt(i);
                        i++;
                        setTimeout(type, speed);
                    } else if (callback) {
                        callback();
                    }
                };
                type();
            };

            /* Reduced delay for a snappier first impression */
            setTimeout(() => {
                typeWriter(part1, headlinePart1, 12, () => {
                    typeWriter(part2, headlinePart2, 8, () => {
                        typeWriter(part3, headlinePart3, 8, () => {
                            typeWriter(sub, subheadlineText, 4, () => {
                                if (trust) {
                                    gsap.to(trust, {
                                        opacity: 1,
                                        y: 0,
                                        duration: 0.8,
                                        ease: 'power3.out',
                                    });
                                }
                            });
                        });
                    });
                });
            }, 200);
        }

        /* ── Scroll-Away Fade (real S1 only) ──────────────────────────────────── */
        if (!isClone) {
            /*
             * Use the canonical #s1 section element as the ScrollTrigger anchor.
             * This is deterministic — getElementById is unique in the DOM —
             * and avoids the querySelector ambiguity that caused the original jump.
             *
             * scrub: true with invalidateOnRefresh: true ensures the animation
             * recalculates correctly after a ScrollTrigger.refresh() call (e.g.
             * after Lenis wraps or window resizes).
             */
            const s1Section = document.getElementById('s1');
            const contentWrapper = boundary.querySelector<HTMLElement>('#s1-scroll-content');

            if (s1Section && contentWrapper) {
                gsap.fromTo(
                    contentWrapper,
                    { opacity: 1, y: 0 },
                    {
                        opacity: 0,
                        y: -(40 * (window.innerHeight / 1080)),
                        ease: 'power1.in',
                        scrollTrigger: {
                            id: 's1-scroll-fade',
                            trigger: s1Section,
                            start: 'top top',
                            end: 'bottom top',
                            scrub: 1.5,
                            invalidateOnRefresh: true,
                        },
                    }
                );
            }
        }
    }
}
