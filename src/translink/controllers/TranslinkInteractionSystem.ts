import gsap from 'gsap';

class TranslinkInteractionSystem {
    init(): void {
        this.setupTiltCards();
    }

    private setupTiltCards(): void {
        const cards = document.querySelectorAll('.tilt-card');

        cards.forEach((card) => {
            const element = card as HTMLElement;

            element.addEventListener('mousemove', (e: MouseEvent) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
                const rotateY = ((x - centerX) / centerX) * 10;

                gsap.to(element, {
                    rotateX,
                    rotateY,
                    duration: 0.5,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
            });

            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.8,
                    ease: 'elastic.out(1, 0.3)',
                });
            });
        });
    }
}

export const interactionSystem = new TranslinkInteractionSystem();
