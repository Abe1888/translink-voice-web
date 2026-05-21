import gsap from 'gsap';

/**
 * TranslinkS3Animator
 *
 * Handles section-specific scroll animations for S3.
 * DRAMATIC parallax content reveal: adds 3D tilt and significant scale.
 */
export class TranslinkS3Animator {
    private tls: gsap.core.Timeline[] = [];

    setup(_parent: HTMLElement): void {
        const section = document.getElementById('s3');
        if (!section) return;

        this.destroy();

        const headline = section.querySelector('h2');
        const stats = section.querySelector('.grid, #s3-stats');

        /* 1. Dramatic Headline Timing (Early reveal) */
        if (headline) {
            const tlH = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 90%',
                    end: 'top 30%',
                    scrub: 2, // Heavier scrub for drama
                    invalidateOnRefresh: true,
                },
            });

            // Extreme 3D entrance
            tlH.fromTo(
                headline,
                {
                    opacity: 0,
                    y: 150,
                    rotateX: -25,
                    scale: 0.9,
                    transformOrigin: 'top',
                },
                {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    scale: 1,
                    ease: 'power3.out',
                }
            );
            this.tls.push(tlH);
        }

        /* 2. Dramatic Stats Timing (Late reveal) */
        if (stats) {
            const tlS = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 70%',
                    end: 'top 10%',
                    scrub: 1.8,
                    invalidateOnRefresh: true,
                },
            });

            tlS.fromTo(
                stats.children,
                {
                    opacity: 0,
                    y: 80,
                    scale: 0.6,
                    rotateY: 15,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotateY: 0,
                    stagger: 0.15,
                    duration: 0.8,
                    ease: 'back.out(1.7)',
                }
            );
            this.tls.push(tlS);
        }

        console.log('[TranslinkS3Animator] Dramatic content animations registered.');
    }

    destroy(): void {
        this.tls.forEach((tl) => tl.kill());
        this.tls = [];
    }
}
