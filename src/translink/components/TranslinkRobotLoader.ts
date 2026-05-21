import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';
/**
 * TranslinkRobotLoader
 *
 * A high-performance, premium loading screen featuring the Translink Robot Mascot.
 * Synchronizes with asset loading progress from World.ts.
 */
export class TranslinkRobotLoader {
    private overlay: HTMLElement | null = null;
    private progressText: HTMLElement | null = null;
    private statusText: HTMLElement | null = null;

    private currentDisplayPercent: number = 0;
    private targetPercent: number = 0;
    private rafId: number | null = null;

    mount(): void {
        const lang = TranslinkLanguageController.getInstance();
        this.overlay = document.createElement('div');
        this.overlay.id = 'translink-loader';
        this.overlay.className =
            'fixed inset-0 w-full h-full bg-[#f5f1e8] z-[99999] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out overflow-hidden';

        // Cyber-Premium Loader with Holographic elements
        this.overlay.innerHTML = `
            <!-- Animated Grid Background -->
            <div class="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,1)_1px,transparent_1px),linear-gradient(rgba(0,0,0,1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            </div>

            <div class="loader-bg-glow absolute inset-0 opacity-30 pointer-events-none"></div>
            
            <div class="loader-content flex flex-col items-center justify-center gap-4 md:gap-8 lg:gap-14 relative z-10 w-full max-h-full py-4 px-4 overflow-y-auto">
                <!-- Robot Mascot with Hologram Glitch -->
                <div class="robot-hologram-wrapper relative flex items-center justify-center py-10 md:py-14">
                    <div class="robot-glitch-overlay absolute inset-0 bg-crimson/10 mix-blend-overlay opacity-0"></div>
                    <div class="creature visible relative !transform-none !static">
                        <div class="robot-floating-wrapper">
                            <div class="robot-head">
                                <div class="robot-headset">
                                    <div class="earcup l"></div>
                                    <div class="earcup r"><div class="robot-mic"></div></div>
                                </div>
                                <div class="robot-antenna"></div>
                                <div class="robot-visor">
                                    <div class="robot-eye"></div>
                                    <div class="robot-eye"></div>
                                </div>
                                <div class="robot-mouth"></div>
                            </div>
                            <div class="robot-body">
                                <div class="robot-hand l"></div>
                                <div class="robot-hand r"></div>
                                <div class="robot-emblem">
                                    <img src="./textures/ui/logo.png" alt="TL Logo">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sci-Fi HUD Loader Display -->
                <div class="flex flex-col items-center w-full relative mt-2 gap-3 md:mt-4 md:gap-4">
                    
                    <!-- HUD Percentage -->
                    <div class="relative px-6 py-2 md:px-10 md:py-4 flex flex-col items-center">
                        <!-- HUD Corners -->
                        <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-crimson"></div>
                        <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-crimson"></div>
                        <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-crimson"></div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-crimson"></div>

                        <span id="loader-percent" class="font-outfit font-black text-5xl md:text-7xl text-crimson tabular-nums tracking-wider leading-none">00%</span>
                        
                        <div class="mt-2 md:mt-4 flex items-center gap-3 opacity-80">
                            <div class="flex gap-1"><div class="w-1.5 h-1.5 bg-crimson"></div><div class="w-1.5 h-1.5 bg-crimson"></div></div>
                            <span id="loader-status" class="font-mono text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-obsidian font-bold">${lang.t('global.loader_core_init')}</span>
                            <div class="flex gap-1"><div class="w-1.5 h-1.5 bg-crimson"></div><div class="w-1.5 h-1.5 bg-crimson"></div></div>
                        </div>
                    </div>
                    
                    <!-- Title Text Frame -->
                    <div class="relative w-full max-w-[340px] border border-black/10 bg-white/30 backdrop-blur-sm p-4 md:p-5 flex flex-col items-center gap-2 md:gap-3 mt-1 md:mt-2" style="clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);">
                        <!-- Frame Corner Accents -->
                        <div class="absolute top-0 left-0 w-12 h-[2px] bg-crimson/50"></div>
                        <div class="absolute bottom-0 right-0 w-12 h-[2px] bg-crimson/50"></div>
                        <div class="absolute top-0 left-0 w-[2px] h-4 bg-crimson/50"></div>
                        <div class="absolute bottom-0 right-0 w-[2px] h-4 bg-crimson/50"></div>
                        
                        <div class="text-center font-mono font-bold tracking-widest uppercase text-sm md:text-lg text-crimson">
                            ${lang.t('global.loader_telematics')}
                        </div>
                        <div class="text-center font-mono font-bold tracking-widest uppercase text-[10px] md:text-sm text-obsidian flex items-center gap-2 md:gap-3 opacity-80">
                            <span>::</span> ${lang.t('global.loader_solution')} <span>::</span>
                        </div>
                    </div>
                </div>
            </div>

        `;

        this.progressText = this.overlay.querySelector('#loader-percent');
        this.statusText = this.overlay.querySelector('#loader-status');

        document.body.appendChild(this.overlay);
    }

    /**
     * Update loading progress
     * @param percent 0 to 100
     */
    update(percent: number): void {
        this.targetPercent = Math.round(percent);

        // Start the speed counter if it's not already running
        if (this.rafId === null) {
            const tick = () => {
                if (this.currentDisplayPercent < this.targetPercent) {
                    // HUD speed count: rapid ease out
                    const diff = this.targetPercent - this.currentDisplayPercent;
                    this.currentDisplayPercent += Math.max(1, Math.ceil(diff * 0.15));

                    if (this.progressText) {
                        this.progressText.innerText = `${this.currentDisplayPercent}%`;
                    }
                    this.rafId = requestAnimationFrame(tick);
                } else {
                    this.rafId = null;
                }
            };
            this.rafId = requestAnimationFrame(tick);
        }

        // Status text instantly follows target
        const lang = TranslinkLanguageController.getInstance();
        if (this.targetPercent > 30 && this.targetPercent < 70 && this.statusText) {
            this.statusText.innerText = lang.t('global.loader_data_stream');
        } else if (this.targetPercent >= 70 && this.targetPercent < 95 && this.statusText) {
            this.statusText.innerText = lang.t('global.loader_neural_sync');
        } else if (this.targetPercent >= 95 && this.statusText) {
            this.statusText.innerText = lang.t('global.loader_complete');
        }
    }

    /**
     * Gracefully hide and remove the loader automatically
     */
    async hide(): Promise<void> {
        if (!this.overlay) return;

        this.update(100);
        
        // Wait for the visual count-up animation to complete to 100%
        while (this.currentDisplayPercent < 100) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Play a premium high-tech entry beep cue if allowed
        try {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            const ctx = new AC();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}

        // Unmute/resume any active audio contexts
        window.dispatchEvent(new CustomEvent('translink:audio-unlock'));

        // Fade out loader
        this.overlay.style.opacity = '0';
        this.overlay.style.pointerEvents = 'none';

        await new Promise((r) => setTimeout(r, 1000));
        this.overlay.remove();
        this.overlay = null;
    }
}
