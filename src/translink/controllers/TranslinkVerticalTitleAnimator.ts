import gsap from 'gsap';

export class TranslinkVerticalTitleAnimator {
    setup(): void {
        const isMobile = window.innerWidth < 768;
        const verticalTexts = document.querySelectorAll('h1.vertical-text, span.vertical-text');

        verticalTexts.forEach((element) => {
            // Only process standard raw string nodes, ignore pre-split DOM
            if (element.querySelector('.char')) return;

            const rawText = element.textContent?.trim();
            if (!rawText) return;

            element.innerHTML = '';

            const isSubtitle = element.tagName === 'SPAN';
            let wordCount = 0;
            const chars = rawText.split('').map((char) => {
                const isSpace = char === ' ' || char === '\n';
                if (isSpace) wordCount++;

                const span = document.createElement('span');
                // Apply 'font-black' to characters in the first two words (wordCount < 2)
                // and 'font-normal' to the rest to create a clear hierarchy
                const weightClass =
                    !isSubtitle && wordCount < 2 ? 'font-black' : 'font-light opacity-80';

                span.className = `char ${isSpace ? '' : 'inline-block'} ${weightClass}`;

                // Only apply will-change on desktop — on mobile this exhausts compositor layers
                if (!isSpace && !isMobile) span.style.willChange = 'transform, opacity';
                span.innerHTML = isSpace ? '&nbsp;' : char;
                return span;
            });

            chars.forEach((c) => element.appendChild(c));

            // Map up to exactly find the specific 100dvh-400dvh section app grid container
            const sectionBounds = element.closest(
                '.translink-app, [class*="translink-s"]'
            ) as HTMLElement;
            if (!sectionBounds) return;

            const targetChars = element.querySelectorAll('span.char');

            if (isSubtitle) {
                // ── Typewriter Animation for Small Text ──
                gsap.fromTo(
                    targetChars,
                    {
                        opacity: 0,
                        filter: 'blur(10px)',
                        scale: 0.8,
                    },
                    {
                        opacity: 1,
                        filter: 'blur(0px)',
                        scale: 1,
                        stagger: 0.03,
                        duration: 0.4,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: sectionBounds,
                            start: 'top 85%',
                            end: 'bottom 15%',
                            toggleActions: 'play reverse play reverse',
                        },
                    }
                );
            } else {
                // ── Ultra-Strong 3D Hyper-Kinetic Reveal ──
                gsap.fromTo(
                    targetChars,
                    {
                        y: isMobile ? 50 : 180, // Massive vertical emergence
                        opacity: 0,
                        rotateX: -135, // Aggressive 3D flip
                        rotateY: 45, // Multi-axis rotation
                        rotateZ: 10, // Slight tilt for organic feel
                        scale: 0, // Emerge from nothing
                        z: -500, // Deep perspective
                        filter: 'blur(15px) brightness(200%)', // Cinematic bloom
                    },
                    {
                        y: 0,
                        opacity: 1,
                        rotateX: 0,
                        rotateY: 0,
                        rotateZ: 0,
                        scale: 1,
                        z: 0,
                        filter: 'blur(0px) brightness(100%)',
                        stagger: {
                            each: 0.04,
                            from: 'start',
                        },
                        duration: 1.5,
                        ease: 'elastic.out(1, 0.55)', // Premium elastic spring physics effect
                        scrollTrigger: {
                            trigger: sectionBounds,
                            start: 'top 80%',
                            end: 'bottom 20%',
                            toggleActions: 'play reverse play reverse',
                        },
                    }
                );
            }

            // ── 3. Optimized Kinetic Scroll Parallax ──
            const titleGroup = element.closest('.flex-col.justify-center') as HTMLElement;
            if (titleGroup && !titleGroup.dataset.parallaxActive) {
                titleGroup.dataset.parallaxActive = 'true';
                gsap.to(titleGroup, {
                    y: -60,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: sectionBounds,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 2.0,
                    },
                });
            } else if (!titleGroup) {
                gsap.to(element, {
                    y: -60,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: sectionBounds,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 2.0,
                    },
                });
            }

            // Original Reference Project Animation: Draw down lines dynamically
            const frame = sectionBounds.querySelector('.section-vertical-title__frame');
            const lines = sectionBounds.querySelectorAll('.section-vertical-title__frame line');

            if (frame && lines.length > 0) {
                gsap.set(lines, { scaleY: 0, transformOrigin: 'top' });
                gsap.set(frame, { opacity: 0 });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: sectionBounds,
                        start: 'top 85%', // Sync with text stagger reveal
                        toggleActions: 'play reverse play reverse',
                    },
                });

                tl.to(frame, { opacity: 1, duration: 0.5 }).to(
                    lines,
                    {
                        scaleY: 1,
                        stagger: 0.25,
                        duration: 2.0,
                        ease: 'expo.out',
                    },
                    '-=0.3'
                );
            }
        });
        // ScrollTrigger.refresh() is deferred — authoritative refresh runs in main.ts
        // via activeSceneBridge?.handleResize() after document.fonts.ready + rAF.
    }
}
