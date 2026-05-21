import { TranslinkLanguageController } from '../../controllers/TranslinkLanguageController';
export class TranslinkS8Sidebar {
    mount(parent: HTMLElement): void {
        const lang = TranslinkLanguageController.getInstance();
        const aside = document.createElement('aside');
        aside.className =
            'w-[var(--sidebar-width)] flex-none flex flex-col items-center py-[clamp(1.5rem,5vh,3rem)] gap-4 bg-transparent relative shrink-0 z-20';

        aside.innerHTML = `
            <div class="flex-none flex flex-col items-center w-full px-0">
                <div id="s8-logo-placeholder" class="w-10 h-10 md:w-[60px] md:h-[60px] mx-auto flex items-center justify-center bg-transparent relative mb-10 md:mb-16"></div>
            </div>

            <div class="flex-1 flex flex-col items-center justify-center relative w-full gap-8 md:gap-12 py-8 md:py-12">
                <span class="text-crimson font-bold text-[0.6vw] uppercase tracking-[0.4em] vertical-text absolute left-1/4 md:left-[15%] bottom-4 opacity-50 font-space">
                    ${lang.t('sections.s8.sidebar_label')}
                </span>
                <span class="text-[1.2vw] leading-none uppercase tracking-widest vertical-text mb-8 md:mb-12 text-obsidian/40 font-bold">
                    ${lang.t('global.brand')}
                </span>
                <h1 class="text-[5.5vw] leading-none font-normal tracking-[0.05em] vertical-text uppercase font-bebas" tech-pulse-text>
                    ${lang.t('sections.s8.vertical_title')}
                </h1>
            </div>

        `;

        parent.appendChild(aside);
    }
}
