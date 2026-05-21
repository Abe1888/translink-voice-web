import { TranslinkLanguageController } from '../../controllers/TranslinkLanguageController';

/**
 * TranslinkS9ContentSection
 *
 * Standardized to the Centralized Theme System.
 */
export class TranslinkS9ContentSection {
    mount(parent: HTMLElement): void {
        const lang = TranslinkLanguageController.getInstance();
        const div = document.createElement('div');
        div.className = 'flex-1 flex flex-col overflow-hidden min-h-0 relative bg-transparent';
        div.innerHTML = `
        <div id="s9-scroll-content" class="w-full h-full p-[var(--hero-p-outer)] flex flex-col justify-center relative z-10">
            <!-- Top Vision Header -->
            <div class="mb-[4vh] opacity-80">
                <span class="text-stat-label font-bold tracking-[0.8em] uppercase text-primary">
                    ${lang.t('sections.s9.content_header')}
                </span>
            </div>

            <!-- Hero Headline -->
            <h2 class="text-fluid-h1 font-medium leading-[1.1] mb-[6vh] max-w-4xl">
                ${lang.t('sections.s9.content_headline_part1')} <br/>
                ${lang.t('sections.s9.content_headline_part2')} <span class="text-crimson">${lang.t('sections.s9.content_headline_part3')}</span>
            </h2>

            <!-- Separator Line -->
            <div class="w-full h-px hud-frame-border mb-[6vh]"></div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
                <div class="flex flex-col">
                    <div class="text-stat-value font-black flex items-baseline">
                        ${lang.t('sections.s9.stat_1_value').replace('CH', '<span class="text-[0.4em] ml-1 font-bold">CH</span>')}
                    </div>
                    <div class="text-stat-label uppercase text-muted font-bold tracking-[0.2em] mt-2">
                        ${lang.t('sections.s9.stat_1_label')}
                    </div>
                </div>
                <div class="flex flex-col">
                    <div class="text-stat-value font-black flex items-baseline">
                        ${lang.t('sections.s9.stat_2_value').replace('P', '<span class="text-[0.4em] ml-1 font-bold">P</span>')}
                    </div>
                    <div class="text-stat-label uppercase text-muted font-bold tracking-[0.2em] mt-2">
                        ${lang.t('sections.s9.stat_2_label')}
                    </div>
                </div>
                <div class="flex flex-col">
                    <div class="text-stat-value font-black flex items-baseline">
                        24<span class="text-[0.4em] mx-0.5 font-bold opacity-40">/</span><span class="text-[0.6em] font-bold">7</span>
                    </div>
                    <div class="text-stat-label uppercase text-muted font-bold tracking-[0.2em] mt-2">
                        ${lang.t('sections.s9.stat_3_label')}
                    </div>
                </div>
                <div class="flex flex-col">
                    <div class="text-stat-value font-black flex items-baseline">
                        ${lang.t('sections.s9.stat_4_value').replace('+', '<span class="text-[0.4em] ml-1 font-bold">+</span>')}
                    </div>
                    <div class="text-stat-label uppercase text-muted font-bold tracking-[0.2em] mt-2">
                        ${lang.t('sections.s9.stat_4_label')}
                    </div>
                </div>
            </div>
        </div>
        `;
        parent.appendChild(div);
    }
}
