import gsap from 'gsap';
import { TranslinkLiveFeedPopup } from '../components/TranslinkLiveFeedPopup';
import { TranslinkLanguageController } from './TranslinkLanguageController';

/**
 * TranslinkLiveFeedController
 *
 * Manages the on-demand lifecycle of service popups.
 * USES EVENT DELEGATION for robust interaction handling.
 */
export class TranslinkLiveFeedController {
    private activePopupId: string | null = null;
    private activeElement: HTMLElement | null = null;

    constructor() {
        this.init();
    }

    private init(): void {
        // Unified click listener for both triggers and closing
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // 1. Handle Trigger Click
            const trigger = target.closest('.live-feed-button-trigger');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();

                // Extract ID from telemetry-btn-sX
                const id = trigger.id.replace('telemetry-btn-', '');
                const lang = TranslinkLanguageController.getInstance();

                const title = lang.t(`sections.${id}.popup_title`);
                const description = lang.t(`sections.${id}.popup_description`);
                const tags = lang.tArray(`sections.${id}.popup_tags`);

                if (title && description) {
                    this.handleTriggerClick(id, { title, description, tags });
                }
                return;
            }

            // 2. Handle Close Button Click (internal to popup)
            const closeBtn = target.closest('.popup-close-trigger');
            if (closeBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.closeActivePopup();
                return;
            }

            // 3. Handle Outside Click (close if open)
            if (this.activeElement && !this.activeElement.contains(target)) {
                this.closeActivePopup();
            }
        });

        // 4. Handle Scroll (close if open)
        const handleScroll = (e: Event) => {
            if (this.activeElement) {
                // Do not close if scrolling originates from inside the popup
                if (e.target instanceof Node && this.activeElement.contains(e.target)) {
                    return;
                }
                this.closeActivePopup();
            }
        };

        window.addEventListener('wheel', handleScroll, { passive: true });
        window.addEventListener('touchmove', handleScroll, { passive: true });
    }

    private handleTriggerClick(id: string, config: any): void {
        if (this.activePopupId === id) {
            this.closeActivePopup();
            return;
        }

        if (this.activePopupId) {
            this.closeActivePopup();
        }

        this.openPopup(id, config);
    }

    private openPopup(id: string, config: any): void {
        const app = document.getElementById('app');
        if (!app) return;

        const popupInstance = new TranslinkLiveFeedPopup(
            id,
            config.title,
            config.description,
            config.tags || []
        );

        const popupEl = popupInstance.create();
        app.appendChild(popupEl);

        this.activePopupId = id;
        this.activeElement = popupEl;

        // Dispatch global event for the Mascot
        window.dispatchEvent(new CustomEvent('translink:popup-open', { detail: { id } }));

        // Entrance animation
        gsap.to(popupEl, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'back.out(1.2)',
        });
    }

    private closeActivePopup(): void {
        if (!this.activeElement) return;

        const el = this.activeElement;
        const id = this.activePopupId;

        this.activePopupId = null;
        this.activeElement = null;

        // Dispatch global event for the Mascot
        if (id) {
            window.dispatchEvent(new CustomEvent('translink:popup-close', { detail: { id } }));
        }

        gsap.to(el, {
            opacity: 0,
            scale: 0.95,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            },
        });
    }
}
