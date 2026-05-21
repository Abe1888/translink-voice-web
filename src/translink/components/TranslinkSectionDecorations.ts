import { animate, svg } from 'animejs';

/**
 * TranslinkSectionDecorations
 *
 * Manages the background decorative layers (Grids, Geometric Shapes, BG Numbers).
 * Refactored for TOTAL CSS CONTROL - 100% Theme Driven.
 */
export interface DecorationConfig {
    showBgNumber?: boolean;
    showHVLines?: boolean;
    showGeo?: boolean;
    showGrid?: boolean;
    showGridBg?: boolean;
    showS10Grid?: boolean;
    showDecoLines?: boolean;
    showDotGrid?: boolean;
    number?: string;
}

export class TranslinkSectionDecorations {
    constructor(
        private id: string,
        private dec: DecorationConfig
    ) {}

    mount(parent: HTMLElement): void {
        const container = document.createElement('div');
        container.className =
            'absolute inset-0 pointer-events-none z-5 overflow-visible section-deco-layer';

        // 1. Background Section Numbers
        if (this.dec.showBgNumber && this.dec.number) {
            const bgNum = document.createElement('div');
            bgNum.id = `${this.id}-num`;
            bgNum.className =
                'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[clamp(15rem,30vw,40rem)] deco-bg-number leading-none';
            bgNum.innerText = this.dec.number;
            container.appendChild(bgNum);
        }

        // 2. Horizontal/Vertical HUD Lines & Geometric Shapes
        if (this.dec.showHVLines || this.dec.showGeo) {
            if (this.dec.showHVLines) {
                // Horizontal Line - Disabled globally as per user request to keep only the footer border
                /*
                const hLinePos = ['s1', 's3', 's5', 's7', 's9'].includes(this.id)
                    ? 'top-[20%]'
                    : 'bottom-[25%]';
                const hLine = document.createElement('div');
                hLine.id = `${this.id}-h-line`;
                hLine.className = `absolute ${hLinePos} left-0 w-full h-[1px] deco-hud-line opacity-30`;
                container.appendChild(hLine);
                */

                // Vertical Line - Aligned with Sidebar (Left) or Nav Gutter (Right)
                const vLinePos = ['s2', 's4', 's6', 's8'].includes(this.id)
                    ? 'left-[var(--sidebar-width)]'
                    : 'right-[var(--gutter-width)]';
                const vLine = document.createElement('div');
                vLine.id = `${this.id}-v-line`;
                vLine.className = `absolute top-0 ${vLinePos} w-[1px] h-full deco-hud-line opacity-30`;
                container.appendChild(vLine);
            }

            if (this.dec.showGeo) {
                // Get the unique telematics route path for the section to reflect different regional map data
                const paths: Record<string, { d: string; viewbox: string }> = {
                    s1: {
                        d: 'M189.142857,4 C227.456875,4 248.420457,4.00974888 256.864191,4.00974888 C263.817211,4.00974888 271.61219,3.69583517 274.986231,6.63061513 C276.382736,7.84531176 279.193529,11.3814152 280.479499,13.4815847 C281.719344,15.5064248 284.841964,20.3571626 275.608629,20.3571626 C265.817756,20.3571626 247.262478,19.9013915 243.955117,19.9013915 C239.27946,19.9013915 235.350655,24.7304885 228.6344,24.7304885 C224.377263,24.7304885 219.472178,21.0304113 214.535324,21.0304113 C207.18393,21.0304113 200.882842,30.4798911 194.124187,30.4798911 C186.992968,30.4798911 182.652552,23.6245972 173.457298,23.6245972 C164.83277,23.6245972 157.191045,31.5424105 157.191045,39.1815359 C157.191045,48.466779 167.088672,63.6623005 166.666679,66.9065088 C166.378668,69.1206889 155.842137,79.2568633 151.508744,77.8570506 C145.044576,75.7689355 109.126667,61.6405346 98.7556561,52.9785141 C96.4766876,51.0750861 89.3680347,39.5769094 83.4195005,38.5221785 C80.6048001,38.0231057 73.0179337,38.7426555 74.4158694,42.6956376 C76.7088819,49.1796531 86.3280337,64.1214904 87.1781062,66.9065088 C88.191957,70.2280995 86.4690152,77.0567847 82.2060607,79.2503488 C79.2489435,80.7719756 73.1324132,82.8858479 64.7015706,83.0708761 C55.1604808,83.2802705 44.4254811,80.401884 39.1722168,80.401884 C25.7762119,80.401884 24.3280517,89.1260466 22.476679,94.4501705 C21.637667,96.8629767 20.4337535,108 33.2301959,108 C37.8976087,108 45.0757044,107.252595 53.4789069,103.876424 C61.8821095,100.500252 122.090049,78.119656 128.36127,75.3523302 C141.413669,69.5926477 151.190142,68.4987755 147.018529,52.0784879 C143.007818,36.291544 143.396957,23.4057975 145.221196,19.6589263 C146.450194,17.1346449 148.420955,14.8552817 153.206723,15.7880203 C155.175319,16.1716965 155.097637,15.0525421 156.757598,11.3860986 C158.417558,7.71965506 161.842736,4.00974888 167.736963,4.00974888 C177.205308,4.00974888 184.938832,4 189.142857,4 Z',
                        viewbox: '0 0 304 112',
                    },
                    s2: {
                        d: 'M10,80 Q90,10 170,80 T330,80 T490,80 T650,80 T810,80',
                        viewbox: '0 0 820 160',
                    },
                    s3: {
                        d: 'M20,100 C150,20 180,180 300,100 C420,20 450,180 570,100 C690,20 720,180 840,100',
                        viewbox: '0 0 860 200',
                    },
                    s4: {
                        d: 'M50,50 L200,50 L200,150 L400,150 L400,50 L600,50 L600,150 L800,150',
                        viewbox: '0 0 850 200',
                    },
                    s5: {
                        d: 'M20,50 C120,50 180,150 280,150 C380,150 440,50 540,50 C640,50 700,150 800,150',
                        viewbox: '0 0 820 200',
                    },
                    s6: {
                        d: 'M10,120 Q120,30 230,120 T450,120 T670,120 T890,120',
                        viewbox: '0 0 900 200',
                    },
                    s7: {
                        d: 'M50,100 C100,50 200,50 250,100 C300,150 400,150 450,100 C500,50 600,50 650,100 C700,150 800,150 850,100',
                        viewbox: '0 0 900 200',
                    },
                    s8: {
                        d: 'M50,50 Q250,200 450,50 T850,50',
                        viewbox: '0 0 900 200',
                    },
                    s9: {
                        d: 'M20,80 C80,20 100,140 160,80 C220,20 240,140 300,80 C360,20 380,140 440,80 C500,20 520,140 580,80 C640,20 660,140 720,80',
                        viewbox: '0 0 740 160',
                    },
                    s10: {
                        d: 'M50,100 L150,100 L250,20 L350,180 L450,100 L550,100 L650,20 L750,180 L850,100',
                        viewbox: '0 0 900 200',
                    },
                };

                const activePath = paths[this.id] || paths.s1;

                // Create the beautiful SVG overlay container (binds with parallax through deco-shape-outline class)
                const geo1 = document.createElement('div');
                geo1.id = `${this.id}-geo1`;
                geo1.className =
                    'absolute top-[15%] right-[5%] w-[35vw] h-[25vh] pointer-events-none z-[1] overflow-visible deco-shape-outline';
                geo1.style.border = 'none'; // Overrides default solid border outline

                geo1.innerHTML = `
                    <svg class="telemetry-track-svg w-full h-full" viewBox="${activePath.viewbox}" preserveAspectRatio="xMidYMid meet">
                        <path class="telemetry-track-path" id="${this.id}-track-path" d="${activePath.d}"></path>
                        <!-- Dynamic directional vehicle pointer and pulsing glow animated perfectly by Anime.js -->
                        <g class="telemetry-track-dot-group" id="${this.id}-track-dot">
                            <circle r="6" fill="#c0202f" opacity="0.4" class="animate-pulse"></circle>
                            <path d="M-5,-3.5 L5,0 L-5,3.5 L-2.5,0 Z" fill="#ffffff" stroke="#c0202f" stroke-width="1"></path>
                        </g>
                    </svg>
                `;
                container.appendChild(geo1);

                // Wait for element mounting, then trigger Anime.js path tracking animations
                setTimeout(() => {
                    const pathEl = document.getElementById(`${this.id}-track-path`);
                    const dotEl = document.getElementById(`${this.id}-track-dot`);
                    if (pathEl && dotEl) {
                        // De-conflict CSS drawing loops to let Anime.js take total authority
                        pathEl.style.animation = 'none';
                        pathEl.style.strokeDashoffset = '0';

                        // 1. Vehicle Pointer movement along path with automatic tangential rotation alignment
                        animate(dotEl, {
                            ease: 'linear',
                            duration: 12000,
                            loop: true,
                            ...svg.createMotionPath(pathEl as any),
                        });

                        // 2. Continuous drawing stroke loop matching the vehicle progress
                        animate(svg.createDrawable(pathEl as any), {
                            draw: '0 1',
                            ease: 'linear',
                            duration: 12000,
                            loop: true,
                        });
                    }
                }, 50);

                // Create the dashboard technical grid-anchor outline box (binds with parallax through deco-shape-solid class)
                const geo2 = document.createElement('div');
                geo2.id = `${this.id}-geo2`;
                geo2.className =
                    'absolute w-[12vh] h-[12vh] top-[60%] left-[10%] rotate-45 border border-dashed border-white/20 flex items-center justify-center bg-transparent deco-shape-solid';
                geo2.style.background = 'transparent'; // Overrides default solid background
                geo2.innerHTML = `<div class="w-1.5 h-1.5 bg-brand-crimson animate-ping rounded-full" style="background-color: #c0202f;"></div>`;
                container.appendChild(geo2);
            }
        }

        // 3. Technical Grids
        if (this.dec.showGridBg) {
            const gridBg = document.createElement('div');
            gridBg.id = `${this.id}-grid-bg`;
            gridBg.className = 'absolute inset-0 deco-grid-linear';
            container.appendChild(gridBg);
        }

        if (this.dec.showDotGrid) {
            const dotGrid = document.createElement('div');
            dotGrid.id = `${this.id}-dot-grid`;
            dotGrid.className = 'absolute inset-0 deco-grid-dots';
            container.appendChild(dotGrid);
        }

        if (this.dec.showS10Grid) {
            const lines = [
                {
                    id: 's10-v-line',
                    class: 'w-px deco-hud-line',
                    style: 'left: 50%; top: 0; bottom: 0;',
                },
                {
                    id: 's10-h-line',
                    class: 'h-px deco-hud-line',
                    style: 'top: 50%; left: 10%; right: 10%;',
                },
            ];
            lines.forEach((l) => {
                const line = document.createElement('div');
                line.id = l.id;
                line.className = `absolute ${l.class}`;
                line.style.cssText = l.style;
                container.appendChild(line);
            });
        }

        // Special Section Overlays (S3 speed lines removed as per request)

        if (this.dec.showDecoLines) {
            [20, 80].forEach((t, idx) => {
                const line = document.createElement('div');
                line.className = `deco-line absolute h-px w-[30vw] deco-hud-line top-[${t}%] right-0`;
                line.id = `${this.id}-deco-line-${idx}`;
                container.appendChild(line);
            });
        }

        // Mount strategy
        if (parent.firstChild) {
            parent.insertBefore(container, parent.firstChild);
        } else {
            parent.appendChild(container);
        }
    }
}
