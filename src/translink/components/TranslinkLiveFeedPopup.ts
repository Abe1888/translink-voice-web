import gsap from 'gsap';
import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';

/**
 * TranslinkLiveFeedPopup
 *
 * A futuristic cybernetic HUD-style diagnostics interface.
 * Implements advanced 3D parallax spring interactions, holographic scan sweeps, 
 * rotating radar reticles, and custom industrial technical layouts.
 */
export class TranslinkLiveFeedPopup {
    private element: HTMLElement | null = null;

    constructor(
        private id: string,
        private title: string,
        private description: string,
        private tags: string[]
    ) {}

    /**
     * Synthesize procedural low-to-high cyber chime on popup open
     */
    private _playOpenBeep(): void {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AC) {
            try {
                const ctx = new AC();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                const now = ctx.currentTime;
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(1100, now + 0.15);
                
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                
                osc.start(now);
                osc.stop(now + 0.2);
            } catch (e) {
                console.log('[HUD] Audio play blocked by browser autoplay policy.');
            }
        }
    }

    /**
     * Synthesize procedural high-to-low cyber chime on popup close
     */
    private _playCloseBeep(): void {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AC) {
            try {
                const ctx = new AC();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                const now = ctx.currentTime;
                osc.frequency.setValueAtTime(950, now);
                osc.frequency.exponentialRampToValueAtTime(350, now + 0.15);
                
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                
                osc.start(now);
                osc.stop(now + 0.2);
            } catch (e) {}
        }
    }

    /**
     * Build the HUD popup element on demand.
     */
    public create(): HTMLElement {
        const lang = TranslinkLanguageController.getInstance();
        const popup = document.createElement('div');
        popup.id = `live-feed-popup-${this.id}`;

        // Highly responsive sizing keeping the 9:16 aspect ratio beautifully while preventing vertical bleed
        const baseClasses =
            'flex fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-auto opacity-0 scale-95 origin-center overflow-visible';

        // MAPPING: Section ID -> Language Key Paths & Image Asset
        const mapping: Record<string, { title: string; desc: string; tags: string; img: string }> =
            {
                s1: {
                    title: 'sections.s1.card1_title',
                    desc: 'sections.s1.card1_desc',
                    tags: 'sections.s1.card1_tags',
                    img: 'gps.webp',
                }, // TELEMATICS
                s2: {
                    title: 'sections.s1.card1_title',
                    desc: 'sections.s1.card1_desc',
                    tags: 'sections.s1.card1_tags',
                    img: 'gps.webp',
                }, // ASSETS-REAL-TIME-TRACKING
                s3: {
                    title: 'sections.s1.card2_title',
                    desc: 'sections.s1.card2_desc',
                    tags: 'sections.s1.card2_tags',
                    img: 'fuel.webp',
                }, // REAL-TIME-FUEL-MONITORING
                s4: {
                    title: 'sections.s6.card1_title',
                    desc: 'sections.s6.card1_desc',
                    tags: 'sections.s6.card1_tags',
                    img: 'can.webp',
                }, // VEHICLE HEALTH & DIAGNOSTICS
                s5: {
                    title: 'sections.s2.card1_title',
                    desc: 'sections.s2.card1_desc',
                    tags: 'sections.s2.card1_tags',
                    img: 'dashcam_black.webp',
                }, // AI-DRIVEN VIDEO TELEMATICS
                s6: {
                    title: 'sections.s4.card2_title',
                    desc: 'sections.s4.card2_desc',
                    tags: 'sections.s4.card2_tags',
                    img: 'rfid.webp',
                }, // SMART IOT SOLUTIONS
                s7: {
                    title: 'sections.s9.popup_title',
                    desc: 'sections.s9.popup_description',
                    tags: 'sections.s9.popup_tags',
                    img: 'dashcam_black.webp',
                }, // AI-DRIVEN VIDEO TELEMATICS
                s8: {
                    title: 'sections.s8.popup_title',
                    desc: 'sections.s8.popup_description',
                    tags: 'sections.s8.popup_tags',
                    img: 'rfid.webp',
                }, // ONE-STOP IoT SOLUTIONS
                s9: {
                    title: 'sections.s10.popup_title',
                    desc: 'sections.s10.popup_description',
                    tags: 'sections.s10.popup_tags',
                    img: 'safety.webp',
                }, // 24/7 SUPPORT
                s10: {
                    title: 'sections.s2.card2_title',
                    desc: 'sections.s2.card2_desc',
                    tags: 'sections.s2.card2_tags',
                    img: 'safety.webp',
                }, // 24/7 CONNECT
            };

        const config = mapping[this.id];

        // Self-contained HUD animations, scrollbars, and styles
        const stylesHTML = `
            <style>
                @keyframes hudLineDraw {
                    from { stroke-dashoffset: 200; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes hudPulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                }
                @keyframes scanningLine {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes blinkDot {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
                .hologram-scan {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(90deg, transparent, rgba(0, 210, 255, 0.4), transparent);
                    box-shadow: 0 0 10px rgba(0, 210, 255, 0.7);
                    animation: scanningLine 3.2s linear infinite;
                    pointer-events: none;
                    z-index: 5;
                }
                .hud-bracket {
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    border-color: rgba(0, 210, 255, 0.4);
                    border-width: 2px;
                    pointer-events: none;
                    transition: border-color 0.4s ease;
                }
                .hud-frame:hover .hud-bracket {
                    border-color: rgba(192, 32, 47, 0.7);
                }
                .hud-bracket-tl { top: 8px; left: 8px; border-right: 0; border-bottom: 0; }
                .hud-bracket-tr { top: 8px; right: 8px; border-left: 0; border-bottom: 0; }
                .hud-bracket-bl { bottom: 8px; left: 8px; border-right: 0; border-top: 0; }
                .hud-bracket-br { bottom: 8px; right: 8px; border-left: 0; border-top: 0; }
                
                .glow-cyan {
                    text-shadow: 0 0 8px rgba(0, 210, 255, 0.5);
                }
                .glow-crimson {
                    text-shadow: 0 0 8px rgba(192, 32, 47, 0.7);
                }
                /* Webkit Scrollbar overrides for absolute neon visual synchronization */
                .hud-desc-scroll::-webkit-scrollbar {
                    width: 3px;
                }
                .hud-desc-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .hud-desc-scroll::-webkit-scrollbar-thumb {
                    background: rgba(0, 210, 255, 0.25);
                    border-radius: 2px;
                }
                .hud-desc-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(192, 32, 47, 0.6);
                }
            </style>
        `;

        if (config) {
            popup.className = `${baseClasses} w-[85vw] max-w-[325px] h-[75vh] max-h-[580px] bg-transparent`;
            const tags = lang.tArray(config.tags);

            popup.innerHTML = `
                ${stylesHTML}
                <div class="hud-frame relative flex flex-col w-full h-full bg-[#07090e]/85 backdrop-blur-md border border-[var(--brand-cyan)]/25 rounded-[12px] p-2 overflow-hidden shadow-[0_0_40px_rgba(0,210,255,0.15)] group transition-all duration-500 hover:shadow-[0_0_50px_rgba(192,32,47,0.25)] hover:border-[var(--brand-crimson)]/40" style="transform-style: preserve-3d;">
                    
                    <!-- HUD Technical Grid Overlay -->
                    <div class="absolute inset-0 opacity-[0.04] pointer-events-none" style="background-image: radial-gradient(circle, #00d2ff 1px, transparent 1px); background-size: 15px 15px;"></div>
                    
                    <!-- Corner Brackets -->
                    <div class="hud-bracket hud-bracket-tl"></div>
                    <div class="hud-bracket hud-bracket-tr"></div>
                    <div class="hud-bracket hud-bracket-bl"></div>
                    <div class="hud-bracket hud-bracket-br"></div>

                    <!-- HUD Top Spec Readout Bar -->
                    <div class="flex items-center justify-between px-3 py-1.5 border-b border-[var(--brand-cyan)]/10 text-[8px] font-mono text-[var(--brand-cyan)]/60 tracking-widest uppercase relative z-20">
                        <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[blinkDot_1.5s_infinite] shadow-[0_0_5px_#10b981]"></span>
                            <span>TL-DIAG: SECURE</span>
                        </div>
                        <div>SYS_REF_800X</div>
                    </div>

                    <!-- HUD Dynamic Connecting Wireframe (Backdrop) -->
                    <svg class="absolute inset-0 w-full h-full pointer-events-none z-[2] opacity-[0.15] group-hover:opacity-[0.25] transition-opacity duration-500" viewBox="0 0 100 100" fill="none">
                        <path d="M 8 8 L 92 8 L 92 92 L 8 92 Z" stroke="#00d2ff" stroke-dasharray="80 15" stroke-dashoffset="0" stroke-width="0.3" class="animate-[hudLineDraw_12s_linear_infinite]" />
                    </svg>

                    <!-- HUD Diagnostic Connecting Path (Connecting Hardware to Panel) -->
                    <svg class="absolute inset-0 w-full h-full pointer-events-none z-[5]" viewBox="0 0 100 160" fill="none">
                        <!-- Glowing Pulse line that draws itself on mount -->
                        <path d="M45 40 L15 40 L15 95" stroke="var(--brand-crimson)" stroke-width="0.6" stroke-dasharray="120" stroke-dashoffset="120" style="animation: hudLineDraw 1.6s cubic-bezier(0.15, 0.85, 0.15, 1) forwards; filter: drop-shadow(0 0 3px var(--brand-crimson));"/>
                        <!-- Hardware Node Marker -->
                        <circle cx="45" cy="40" r="2" stroke="var(--brand-crimson)" stroke-width="0.5" class="opacity-70"/>
                        <circle cx="45" cy="40" r="0.75" fill="var(--brand-crimson)" class="opacity-90"/>
                        <!-- Card Node Marker -->
                        <circle cx="15" cy="95" r="2" stroke="var(--brand-crimson)" stroke-width="0.5" class="opacity-70"/>
                        <circle cx="15" cy="95" r="0.75" fill="var(--brand-crimson)" class="opacity-90"/>
                    </svg>

                    <!-- Top Section: Hardware Asset Viewer (55% height) -->
                    <div class="relative w-full h-[55%] flex items-center justify-center p-4 md:p-6 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-10 overflow-hidden" style="transform-style: preserve-3d;">
                        
                        <!-- Rotating High-Tech Reticle Background (Dual Counter-Rotating Rings) -->
                        <div class="absolute w-[180px] h-[180px] rounded-full border border-dashed border-[var(--brand-cyan)]/15 animate-[spin_30s_linear_infinite] flex items-center justify-center">
                            <div class="w-[140px] h-[140px] rounded-full border border-[var(--brand-cyan)]/5"></div>
                        </div>
                        <div class="absolute w-[110px] h-[110px] rounded-full border border-dashed border-[var(--brand-crimson)]/10 animate-[spin_15s_linear_infinite_reverse] pointer-events-none"></div>
                        
                        <!-- Crosshair Overlay Lines -->
                        <div class="absolute w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-cyan)]/10 to-transparent"></div>
                        <div class="absolute h-[200px] w-[1px] bg-gradient-to-b from-transparent via-[var(--brand-cyan)]/10 to-transparent"></div>

                        <!-- Scanline Effect -->
                        <div class="hologram-scan"></div>

                        <img src="./images/servicescards/${config.img}" alt="${lang.t(config.title)}" class="max-w-[85%] max-h-[85%] object-contain pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105 group-hover:-translate-y-3 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" style="transform: translateZ(50px);">
                        
                        <!-- Dynamic Coordinate readouts (simulating active tracking ticks) -->
                        <div class="hud-lat absolute top-4 left-4 font-mono text-[7px] text-[var(--brand-cyan)]/40 tracking-tighter">
                            + 9.0128° N
                        </div>
                        <div class="hud-lon absolute bottom-4 right-4 font-mono text-[7px] text-[var(--brand-cyan)]/40 tracking-tighter">
                            + 38.7468° E
                        </div>
                    </div>

                    <!-- Bottom Section: Technical UI Text Panel (45% height) -->
                    <div class="relative w-full h-[45%] p-5 md:p-6 bg-[#06080d]/92 border border-[var(--brand-cyan)]/25 z-20 flex flex-col justify-between" style="clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px)); transform: translateZ(25px);">
                        
                        <!-- Pulse Overlay Glow -->
                        <div class="absolute inset-0 bg-gradient-to-b from-[var(--brand-cyan)]/5 to-transparent pointer-events-none"></div>

                        <!-- Top border neon indicator -->
                        <div class="absolute top-0 left-0 right-[15px] h-[2px] bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-crimson)]"></div>
                        
                        <div class="flex flex-col h-full justify-between">
                            <div>
                                <!-- Header Status Row -->
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-mono text-[8px] tracking-[0.25em] text-[var(--brand-cyan)] font-extrabold uppercase">TL_SEC_${this.id.toUpperCase()}_SYS</span>
                                    <div class="flex gap-1.5">
                                        <div class="w-1.5 h-1.5 bg-[var(--brand-crimson)] rounded-full animate-pulse shadow-[0_0_5px_var(--brand-crimson)]"></div>
                                        <div class="w-1.5 h-1.5 bg-[var(--brand-cyan)] rounded-full animate-pulse shadow-[0_0_5px_var(--brand-cyan)]"></div>
                                    </div>
                                </div>

                                <!-- Title -->
                                <h3 class="font-inter font-black text-xl md:text-2xl tracking-tight text-white mb-2 uppercase leading-none transition-colors duration-500 group-hover:text-[var(--brand-crimson)] glow-cyan group-hover:glow-crimson">${lang.t(config.title)}</h3>
                                
                                <!-- Futuristic pill tags -->
                                <div class="flex flex-wrap gap-1.5 mb-3">
                                    ${tags
                                        .slice(0, 3)
                                        .map(
                                            (tag) => `
                                        <span class="px-2 py-0.5 border border-[var(--brand-cyan)]/30 bg-[var(--brand-cyan)]/5 rounded-sm text-[7px] font-mono font-bold uppercase tracking-widest text-[var(--brand-cyan)] transition-all duration-300 hover:bg-[var(--brand-crimson)]/20 hover:border-[var(--brand-crimson)]/50 hover:text-white cursor-default whitespace-nowrap">${tag}</span>
                                    `
                                        )
                                        .join('')}
                                </div>

                                <!-- Description -->
                                <p class="hud-desc-scroll text-[9.5px] md:text-[10px] leading-relaxed text-slate-300 font-mono tracking-tight text-left max-h-[75px] md:max-h-[90px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent">
                                    ${lang.t(config.desc)}
                                </p>
                            </div>

                            <!-- Bottom Diagnostic Bar -->
                            <div class="pt-2 border-t border-[var(--brand-cyan)]/15 mt-2">
                                <div class="flex justify-between items-center text-[7px] font-mono text-slate-400 mb-1">
                                    <span>DATA LINK: SECURE</span>
                                    <span class="text-[var(--brand-cyan)] font-extrabold animate-pulse">TRANSLINK CORE v3.0</span>
                                </div>
                                <div class="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div class="h-full bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-crimson)] rounded-full transition-all duration-1000 w-[85%] group-hover:w-[100%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Close Trigger (Tech crosshair button) -->
                    <button class="popup-close-trigger absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-all bg-[#0a0d14]/80 border border-[var(--brand-cyan)]/30 rounded-full text-white/50 hover:text-white hover:border-[var(--brand-crimson)] hover:bg-[var(--brand-crimson)]/20 hover:rotate-90 z-[70] shadow-[0_0_5px_rgba(0,210,255,0.1)] hover:shadow-[0_0_10px_rgba(192,32,47,0.3)]">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            // Default: Fallback card with sleek HUD styling
            popup.className = `${baseClasses} w-[85vw] max-w-[480px] bg-transparent`;
            popup.innerHTML = `
                ${stylesHTML}
                <div class="hud-frame relative flex flex-col w-full bg-[#07090e]/85 backdrop-blur-md border border-[var(--brand-cyan)]/25 rounded-[12px] p-5 shadow-[0_0_40px_rgba(0,210,255,0.15)] group transition-all duration-500 hover:shadow-[0_0_50px_rgba(192,32,47,0.25)] hover:border-[var(--brand-crimson)]/40" style="transform-style: preserve-3d;">
                    
                    <!-- Corner Brackets -->
                    <div class="hud-bracket hud-bracket-tl"></div>
                    <div class="hud-bracket hud-bracket-tr"></div>
                    <div class="hud-bracket hud-bracket-bl"></div>
                    <div class="hud-bracket hud-bracket-br"></div>
                    
                    <div class="flex flex-col gap-4 text-white relative z-10 text-left" style="transform: translateZ(25px);">
                        <!-- Header Status Row -->
                        <div class="flex items-center justify-between pb-2 border-b border-[var(--brand-cyan)]/15">
                            <span class="font-mono text-[8px] tracking-[0.25em] text-[var(--brand-cyan)] font-extrabold uppercase">TL_SEC_GEN_SYS</span>
                            <div class="flex gap-1.5">
                                <div class="w-1.5 h-1.5 bg-[var(--brand-cyan)] rounded-full animate-pulse shadow-[0_0_5px_var(--brand-cyan)]"></div>
                            </div>
                        </div>

                        <!-- Title -->
                        <h3 class="text-2xl font-inter font-black uppercase tracking-tight text-white mb-1 group-hover:text-[var(--brand-crimson)] transition-colors duration-500 glow-cyan group-hover:glow-crimson">${this.title}</h3>
                        
                        <!-- Futuristic pill tags -->
                        <div class="flex flex-wrap gap-1.5">
                            ${this.tags
                                .map(
                                    (tag) => `
                                <span class="px-2 py-0.5 border border-[var(--brand-cyan)]/30 bg-[var(--brand-cyan)]/5 rounded-sm text-[7px] font-mono font-bold uppercase tracking-widest text-[var(--brand-cyan)] transition-all duration-300 cursor-default whitespace-nowrap">${tag}</span>
                            `
                                )
                                .join('')}
                        </div>

                        <!-- Description -->
                        <p class="hud-desc-scroll text-xs leading-relaxed text-slate-300 font-mono tracking-tight pr-1 overflow-y-auto max-h-[140px] scrollbar-thin scrollbar-track-transparent">
                            ${this.description}
                        </p>

                        <!-- Bottom Diagnostic Bar -->
                        <div class="pt-2 border-t border-[var(--brand-cyan)]/15 mt-1 flex justify-between items-center text-[7px] font-mono text-slate-400">
                            <span>DATA LINK: SECURE</span>
                            <span class="text-[var(--brand-cyan)] font-extrabold animate-pulse">TRANSLINK CORE v3.0</span>
                        </div>
                    </div>

                    <!-- Close Trigger -->
                    <button class="popup-close-trigger absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-all bg-[#0a0d14]/80 border border-[var(--brand-cyan)]/30 rounded-full text-white/50 hover:text-white hover:border-[var(--brand-crimson)] hover:bg-[var(--brand-crimson)]/20 hover:rotate-90 z-[70] shadow-[0_0_5px_rgba(0,210,255,0.1)] hover:shadow-[0_0_10px_rgba(192,32,47,0.3)]">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            `;
        }

        // 1. Play procedural low-to-high swoop beep chime
        this._playOpenBeep();

        // 2. Telemetry Coordinate Live-Flickering engine
        const latEl = popup.querySelector('.hud-lat');
        const lonEl = popup.querySelector('.hud-lon');
        if (latEl && lonEl) {
            const flickerInterval = setInterval(() => {
                // Ensure elements are still in the DOM before updating
                if (!document.body.contains(popup)) {
                    clearInterval(flickerInterval);
                    return;
                }
                const latVal = (9.0128 + (Math.random() - 0.5) * 0.0006).toFixed(4);
                const lonVal = (38.7468 + (Math.random() - 0.5) * 0.0006).toFixed(4);
                latEl.textContent = `+ ${latVal}° N`;
                lonEl.textContent = `+ ${lonVal}° E`;
            }, 400);
        }

        // 3. Play close chime when the close button is clicked
        popup.querySelector('.popup-close-trigger')?.addEventListener('click', () => {
            this._playCloseBeep();
        });

        // 4. Interactive 3D Parallax Tilt Effect with GSAP spring
        popup.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = popup.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            
            // Calculate tilt angle (max 8 degrees)
            const angleX = -(y - yc) / (yc / 6);
            const angleY = (x - xc) / (xc / 6);
            
            const card = popup.querySelector('.hud-frame') as HTMLElement;
            if (card) {
                gsap.to(card, {
                    rotationX: angleX,
                    rotationY: angleY,
                    ease: 'power2.out',
                    duration: 0.3,
                    transformPerspective: 1000
                });
            }
        });
        
        popup.addEventListener('mouseleave', () => {
            const card = popup.querySelector('.hud-frame') as HTMLElement;
            if (card) {
                gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    ease: 'power3.out',
                    duration: 0.5
                });
            }
        });

        this.element = popup;
        return popup;
    }

    getElement(): HTMLElement | null {
        return this.element;
    }
}
