import gsap from 'gsap';
import { interpolate } from '../utils/flubber';

interface FlubberInterpolator {
    (t: number): string;
}

export class TranslinkLogoAnimator {
    private masterTimeline: gsap.core.Timeline | null = null;
    private interpolatorL: FlubberInterpolator | null = null;
    private interpolatorR: FlubberInterpolator | null = null;
    private originalPathL: string = '';
    private originalPathR: string = '';
    private lenT: number = 0;
    private lenB: number = 0;
    private cachedInnerHeight: number = 0;
    private lastY: number = -1;
    private lastOffsetT: number = -1;
    private lastOffsetB: number = -1;
    private lastP: number = -1;

    setup(): void {
        const pathL = document.getElementById('path-l');
        const pathR = document.getElementById('path-r');
        const circleT = document.getElementById('circle-t');
        const circleB = document.getElementById('circle-b');

        if (pathL && pathR && circleT && circleB) {
            this.originalPathL = pathL.getAttribute('d') || '';
            this.originalPathR = pathR.getAttribute('d') || '';
        } else {
            console.warn('[TranslinkLogoAnimator] Core logo assets missing.');
            return;
        }

        this.initFlubberInterpolators();
        this.initTrimMasks();
        this.cachedInnerHeight = window.innerHeight;
        this.setupMasterTimeline();
    }

    private initTrimMasks(): void {
        const guideT = document.getElementById('trim-guide-t') as unknown as SVGPathElement;
        const guideB = document.getElementById('trim-guide-b') as unknown as SVGPathElement;
        if (guideT && guideB) {
            this.lenT = guideT.getTotalLength();
            this.lenB = guideB.getTotalLength();
            gsap.set([guideT, guideB], {
                strokeDasharray: (i) => (i === 0 ? this.lenT : this.lenB),
                strokeDashoffset: 0,
            });
        }
    }

    private initFlubberInterpolators(): void {
        const S1_END = 0.091;
        try {
            // TARGET SHAPE: Must match the layout at S1_END exactly to avoid a jump
            const parallelL = this.generateDynamicPath(true, 0, S1_END);
            const parallelR = this.generateDynamicPath(false, 0, S1_END);
            this.interpolatorL = interpolate(this.originalPathL, parallelL, {
                maxSegmentLength: 2,
            });
            this.interpolatorR = interpolate(this.originalPathR, parallelR, {
                maxSegmentLength: 2,
            });
        } catch (e) {
            console.error('[TranslinkLogoAnimator/Flubber Error]', e);
        }
    }

    private generateDynamicPath(
        isLeft: boolean,
        extensionProgress: number,
        overrideProgress?: number
    ): string {
        const globalProgress =
            overrideProgress !== undefined
                ? overrideProgress
                : this.masterTimeline
                  ? this.masterTimeline.progress()
                  : 0;

        let thicknessMultiplier = 1.0;
        if (globalProgress > 0.1 && globalProgress <= 0.5) {
            thicknessMultiplier = 1.0 - (0.9 * (globalProgress - 0.1)) / 0.4;
        } else if (globalProgress > 0.5) {
            thicknessMultiplier = 0.1 + (0.9 * (globalProgress - 0.5)) / 0.5;
        }

        const thickness = 10 * thicknessMultiplier;
        const halfThick = thickness / 2;

        // HORIZONTAL EXPANSION LOGIC
        // Start smooth expansion at 4% scroll progress
        let spreadProgress = 0;
        if (globalProgress >= 0.04 && globalProgress <= 0.12) {
            // Smoothly expand between 4% and 12%
            const t = (globalProgress - 0.04) / 0.08;
            spreadProgress = 0.5 - 0.5 * Math.cos(Math.PI * t); // Sine ease-in-out
        } else if (globalProgress > 0.12 && globalProgress <= 0.96) {
            // Locked at full expansion
            spreadProgress = 1.0;
        } else if (globalProgress > 0.96) {
            // Rapid contraction at the very end
            spreadProgress = (1.0 - globalProgress) / 0.04;
        }

        // Base center at start: 75 (Left), 125 (Right)
        // Match Big Text Width at max: 60 (Left), 140 (Right)
        const baseL = 75;
        const baseR = 125;
        const targetL = 60;
        const targetR = 140;

        const centerX = isLeft
            ? baseL + (targetL - baseL) * spreadProgress
            : baseR + (targetR - baseR) * spreadProgress;

        const baseLength = 140;
        const maxExtension = 1260;
        const totalLength = baseLength + maxExtension * extensionProgress;
        const halfLength = totalLength / 2;
        const centerY = 100;

        const x1 = centerX - halfThick;
        const x2 = centerX + halfThick;
        const y1 = centerY - halfLength;
        const y2 = centerY + halfLength;

        return `M${x1},${y1} L${x2},${y1} L${x2},${y2} L${x1},${y2} Z`;
    }

    private setupMasterTimeline(): void {
        const circleT = document.getElementById('circle-t');
        const circleB = document.getElementById('circle-b');
        const pathL = document.getElementById('path-l');
        const pathR = document.getElementById('path-r');
        const conduitGroup = document.getElementById('conduit-group');
        const logoCircleGroup = document.getElementById('logo-circle');
        const guideT = document.getElementById('trim-guide-t');
        const guideB = document.getElementById('trim-guide-b');

        if (
            !circleT ||
            !circleB ||
            !pathL ||
            !pathR ||
            !conduitGroup ||
            !logoCircleGroup ||
            !guideT ||
            !guideB
        )
            return;

        const appScrollLayer = document.getElementById('app');
        if (!appScrollLayer) return;

        const S1_END = 0.091;
        const ARC_TRIM_END = 0.02;
        const S10_START = 0.909;

        const morphEase = (t: number): number =>
            t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const tracker = { p: 0 };

        this.masterTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: appScrollLayer,
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
                invalidateOnRefresh: true,
                onRefresh: () => {
                    this.cachedInnerHeight = window.innerHeight;
                    this.lastY = -1;
                },
            },
        });

        this.masterTimeline.to(tracker, {
            p: 1,
            duration: 1,
            ease: 'none',
            onUpdate: () => {
                const p = Math.max(0, Math.min(1, tracker.p));

                // PERFORMANCE: Skip update if scroll change is negligible (sub-frame)
                if (Math.abs(p - this.lastP) < 0.0002) return;
                this.lastP = p;

                const maxY = this.cachedInnerHeight - 60;
                let yPx: number;
                if (p <= S10_START) {
                    yPx = (p / S10_START) * maxY;
                } else {
                    const resetT = (p - S10_START) / (1.0 - S10_START);
                    yPx = (1 - resetT) * maxY;
                }

                if (Math.abs(yPx - this.lastY) > 0.5) {
                    gsap.set([conduitGroup, logoCircleGroup], { y: yPx });
                    this.lastY = yPx;
                }

                if (p < 0.001) {
                    if (this.interpolatorL && this.interpolatorR) {
                        pathL.setAttribute('d', this.interpolatorL(0));
                        pathR.setAttribute('d', this.interpolatorR(0));
                    }
                    if (this.lastOffsetT !== 0) {
                        gsap.set(guideT, { strokeDashoffset: 0 });
                        this.lastOffsetT = 0;
                    }
                    if (this.lastOffsetB !== 0) {
                        gsap.set(guideB, { strokeDashoffset: 0 });
                        this.lastOffsetB = 0;
                    }
                } else if (p < S1_END) {
                    const trimP = Math.min(1, p / ARC_TRIM_END);
                    const newOffT = this.lenT * trimP;
                    const newOffB = this.lenB * trimP;
                    if (Math.abs(newOffT - this.lastOffsetT) > 0.5) {
                        gsap.set(guideT, { strokeDashoffset: newOffT });
                        this.lastOffsetT = newOffT;
                    }
                    if (Math.abs(newOffB - this.lastOffsetB) > 0.5) {
                        gsap.set(guideB, { strokeDashoffset: newOffB });
                        this.lastOffsetB = newOffB;
                    }

                    const tMorph = morphEase(p / S1_END);
                    if (this.interpolatorL && this.interpolatorR) {
                        pathL.setAttribute('d', this.interpolatorL(tMorph));
                        pathR.setAttribute('d', this.interpolatorR(tMorph));
                    }
                } else if (p < S10_START) {
                    const stretchT = (p - S1_END) / (S10_START - S1_END);
                    const easedStretch = 0.5 - 0.5 * Math.cos(Math.PI * stretchT);

                    pathL.setAttribute('d', this.generateDynamicPath(true, easedStretch));
                    pathR.setAttribute('d', this.generateDynamicPath(false, easedStretch));

                    if (this.lastOffsetT !== this.lenT) {
                        gsap.set(guideT, { strokeDashoffset: this.lenT });
                        this.lastOffsetT = this.lenT;
                    }
                    if (this.lastOffsetB !== this.lenB) {
                        gsap.set(guideB, { strokeDashoffset: this.lenB });
                        this.lastOffsetB = this.lenB;
                    }
                } else {
                    const resetP = (p - S10_START) / (1.0 - S10_START);
                    if (resetP < 0.5) {
                        const contractT = 1 - resetP * 2;
                        pathL.setAttribute('d', this.generateDynamicPath(true, contractT));
                        pathR.setAttribute('d', this.generateDynamicPath(false, contractT));

                        gsap.set(guideT, { strokeDashoffset: this.lenT });
                        gsap.set(guideB, { strokeDashoffset: this.lenB });
                    } else {
                        const isAtEnd = p > 0.999;
                        const morphBackT = isAtEnd ? 0 : 1 - (resetP - 0.5) * 2;

                        if (this.interpolatorL && this.interpolatorR) {
                            pathL.setAttribute('d', this.interpolatorL(morphBackT));
                            pathR.setAttribute('d', this.interpolatorR(morphBackT));
                        }
                        const trimBackP = p >= 0.98 ? (1.0 - p) / 0.02 : 1;
                        const tTrimBack = morphEase(Math.max(0, trimBackP));

                        gsap.set(guideT, { strokeDashoffset: this.lenT * tTrimBack });
                        gsap.set(guideB, { strokeDashoffset: this.lenB * tTrimBack });
                    }
                }
            },
        });
    }

    destroy(): void {
        if (this.masterTimeline) this.masterTimeline.kill();
        this.masterTimeline = null;
        this.interpolatorL = null;
        this.interpolatorR = null;
    }
}
