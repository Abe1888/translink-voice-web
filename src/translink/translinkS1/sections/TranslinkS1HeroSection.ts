import { TranslinkLanguageController } from '../../controllers/TranslinkLanguageController';
export class TranslinkS1HeroSection {
    mount(parent: HTMLElement): void {
        const lang = TranslinkLanguageController.getInstance();
        const div = document.createElement('div');
        div.className =
            'flex-1 flex flex-col landscape:flex-row overflow-hidden min-h-0 relative bg-transparent';
        div.innerHTML = `
            <!-- 3D Canvas Column -->
            <div class="w-full landscape:w-[50%] flex-1 landscape:flex-none landscape:h-full p-[var(--hero-p-inner)] flex items-center justify-center order-2 landscape:order-1 min-h-0 relative z-10">
                <div id="three-canvas-container" class="w-full h-full max-h-[100%] flex items-center justify-center relative overflow-hidden group">
                </div>
            </div>

            <!-- Text Content -->
            <div id="s1-scroll-content" class="w-full landscape:w-[50%] flex-1 landscape:flex-none landscape:h-full p-[var(--hero-p-outer)] flex flex-col order-1 landscape:order-2 border-b landscape:border-b-0 landscape:border-l border-transparent bg-transparent min-h-0 overflow-y-auto custom-scrollbar relative z-10">
                <div class="w-full mt-[12vh] mb-auto landscape:my-auto py-4">
                    <h2 class="text-[clamp(1.5rem,3.2vw,5rem)] !font-inter !font-black leading-[1.1] tracking-tight mb-[var(--hero-title-mb)] min-h-[3em]">
                        <div class="whitespace-nowrap">
                            <span class="s1-part1 text-crimson"></span>
                            <span class="s1-part2 text-obsidian"></span>
                        </div>
                        <div class="whitespace-nowrap">
                            <span class="s1-part3 text-obsidian text-[0.85em] opacity-80"></span>
                        </div>
                    </h2>
                    <p class="s1-anim-subheadline text-fluid-p text-secondary mb-[var(--hero-para-mb)] leading-relaxed font-medium min-h-[4em]"></p>

                    <!-- Stats Row -->
                    <div class="s1-anim-trust opacity-0 translate-y-4 flex gap-[var(--hero-gap)]">
                        <div>
                            <div class="text-stat-value font-black flex items-baseline">
                                12<span class="text-crimson text-[0.6em]">+</span>
                            </div>
                            <div class="text-stat-label uppercase text-muted font-bold leading-tight tracking-wider">
                                ${lang.t('sections.s1.trust_badge_years')}<br/>${lang.t('sections.s1.trust_badge_excellence')}
                            </div>
                        </div>
                        <div>
                            <div class="text-stat-value font-black flex items-baseline">
                                99.9<span class="text-crimson text-[0.6em]">%</span>
                            </div>
                            <div class="text-stat-label uppercase text-muted font-bold leading-tight tracking-wider">
                                ${lang.t('sections.s1.trust_badge_platform')}<br/>${lang.t('sections.s1.trust_badge_uptime')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        parent.appendChild(div);
    }
}
