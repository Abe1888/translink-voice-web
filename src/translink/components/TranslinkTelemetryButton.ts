/**
 * TranslinkTelemetryButton
 *
 * Creates a section Telemetry HUD button that:
 * - Starts hidden (opacity 0)
 * - Fades in when its section enters the viewport
 * - At deeper scroll (section center visible), signals the companion to fly over
 * - Fades out + companion returns home when section exits
 *
 * IMPORTANT: Uses threshold: 0.0 with rootMargin to detect scroll depth,
 * because sections taller than the viewport can NEVER reach threshold: 0.50.
 */
import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';

export class TranslinkTelemetryButton {
    constructor(
        private id: string,
        private label: string
    ) {}

    mount(parent: HTMLElement): void {
        const lang = TranslinkLanguageController.getInstance();

        const wrapper = document.createElement('div');
        wrapper.className = 'relative inline-block portrait:hidden';
        wrapper.id = `telemetry-wrapper-${this.id}`;
        if (window.innerWidth <= 1024) {
            wrapper.style.display = 'none';
        }

        const btn = document.createElement('button');
        btn.id = `telemetry-btn-${this.id}`;
        btn.className =
            'flex items-center gap-[0.8vw] px-[1.2vw] py-[0.6vw] portrait:hidden bg-[var(--brand-obsidian)] hover:bg-[var(--brand-crimson)] transition-colors duration-300 relative z-10 pointer-events-auto live-feed-button-trigger';

        const sectionId = this.label.split('_')[1] || this.label;
        btn.innerHTML = `
            <div class="w-[0.4vw] h-[0.4vw] portrait:w-[1.5vw] portrait:h-[1.5vw] rounded-full bg-white shrink-0"></div>
            <span class="text-white font-normal text-[0.9vw] portrait:text-[3vw] tracking-[0.1em] uppercase whitespace-nowrap">
                <span class="portrait:hidden">${lang.t('global.telemetry')}_</span>${sectionId}
            </span>
        `;

        // Hidden by default
        wrapper.style.opacity = '0';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.transition = 'opacity 0.5s ease';

        wrapper.appendChild(btn);
        parent.appendChild(wrapper);

        // ── Wire up scroll-based visibility + companion flight ────────────────
        setTimeout(() => {
            if (window.innerWidth <= 1024) {
                return; // Do not observe or run presentation logic on mobile/tablet
            }
            const sectionEl = document.querySelector(`.translink-${this.id}`) as HTMLElement | null;
            if (!sectionEl) {
                console.warn(`[TelemetryButton] Section .translink-${this.id} not found`);
                return;
            }

            let companionFlying = false;

            // The wrapper stays permanently at opacity: 0.
            // The button is ONLY visible when reparented and carried by the companion.

            // ── Observer 2: Section ~50% scrolled → companion flies to button ──
            // Since sections are taller than viewport, threshold:0.5 NEVER fires.
            // Instead, use rootMargin to shrink the observation window to the
            // CENTER of the viewport. When the section's top edge crosses that
            // center line, it means ~50% of the section has scrolled past.
            const flyObserver = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (!document.getElementById('tl-companion')) {
                            return;
                        }
                        if (entry.isIntersecting && !companionFlying) {
                            companionFlying = true;
                            void import('./TranslinkEasterEggFriend').then(({ TranslinkEasterEggFriend }) => {
                                const companion = TranslinkEasterEggFriend.getInstance();
                                companion.flyToButton(btn);
                                console.log(`[TelemetryButton] ${this.id} companion flying to button`);
                            });
                        } else if (!entry.isIntersecting && companionFlying) {
                            companionFlying = false;
                            void import('./TranslinkEasterEggFriend').then(({ TranslinkEasterEggFriend }) => {
                                const companion = TranslinkEasterEggFriend.getInstance();
                                companion.returnHome();
                                console.log(`[TelemetryButton] ${this.id} companion returning home`);
                            });
                        }
                    }
                },
                {
                    // rootMargin shrinks the observation rect to the center 2px band.
                    // Top margin = -50vh (ignore top half), bottom margin = -50vh + 2px
                    // This means: "fire when any part of the section crosses viewport center"
                    rootMargin: '-50% 0px -50% 0px',
                    threshold: 0,
                }
            );
            flyObserver.observe(sectionEl);
        }, 250);
    }
}
