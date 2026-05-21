import gsap from 'gsap';

export class TranslinkCursorController {
    private cursorDot: HTMLElement | null = null;
    private cursorRing: HTMLElement | null = null;
    private setDotX: any = null;
    private setDotY: any = null;
    private setRingX: any = null;
    private setRingY: any = null;
    private rafId: number | null = null;
    private mouseX: number = 0;
    private mouseY: number = 0;

    setup(): void {
        this.cursorDot = document.getElementById('cursor-dot');
        this.cursorRing = document.getElementById('cursor-ring');

        if (!this.cursorDot || !this.cursorRing) {
            console.warn('[TranslinkCursorController] Cursor elements not found');
            return;
        }

        // Initialize setters
        this.setDotX = gsap.quickSetter(this.cursorDot, 'x', 'px');
        this.setDotY = gsap.quickSetter(this.cursorDot, 'y', 'px');
        this.setRingX = gsap.quickTo(this.cursorRing, 'x', { duration: 0.3, ease: 'power2.out' });
        this.setRingY = gsap.quickTo(this.cursorRing, 'y', { duration: 0.3, ease: 'power2.out' });

        // Center elements
        gsap.set(this.cursorDot, { xPercent: -50, yPercent: -50 });
        gsap.set(this.cursorRing, { xPercent: -50, yPercent: -50 });

        window.addEventListener('mousemove', this.onMouseMove, { passive: true });

        this.setupHoverTriggers();
    }

    private onMouseMove = (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        if (this.rafId === null) {
            this.rafId = requestAnimationFrame(this.updateCursor);
        }
    };

    private updateCursor = () => {
        if (this.setDotX && this.setDotY && this.setRingX && this.setRingY) {
            this.setDotX(this.mouseX);
            this.setDotY(this.mouseY);
            this.setRingX(this.mouseX);
            this.setRingY(this.mouseY);
        }
        this.rafId = null;
    };

    setupHoverTriggers(): void {
        const triggers = document.querySelectorAll(
            'a, button, [role="button"], .live-feed-button-trigger, .sound-toggle-trigger'
        );

        triggers.forEach((trigger) => {
            trigger.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
            trigger.addEventListener('mouseleave', () =>
                document.body.classList.remove('hovering')
            );
        });
    }

    destroy(): void {
        window.removeEventListener('mousemove', this.onMouseMove);
        if (this.rafId) cancelAnimationFrame(this.rafId);
        document.body.classList.remove('hovering');
    }
}
