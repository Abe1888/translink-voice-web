import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';
/**
 * TranslinkSectionLayout
 *
 * Shared layout wrapper for all sections.
 * Standardizes the 3-column structure (Sidebar | Main Content | Nav Gutter).
 */
export class TranslinkSectionLayout {
    static createWrapper(id?: string): HTMLElement {
        const appWrapper = document.createElement('div');
        appWrapper.className =
            'translink-app min-h-[calc(var(--vh,1vh)*100)] overflow-visible z-[1000] flex flex-col relative';
        if (id) {
            appWrapper.id = id;
            appWrapper.classList.add(`translink-${id}`);
        }

        const container = document.createElement('div');

        container.className = 'flex flex-1 w-full overflow-visible min-h-0';
        appWrapper.appendChild(container);

        return appWrapper;
    }

    static addNavGutter(container: HTMLElement): void {
        const navSpace = document.createElement('div');
        navSpace.className =
            'w-[var(--gutter-width)] flex-none shrink-0 border-l border-transparent bg-transparent';
        container.appendChild(navSpace);
    }

    static addFooter(appWrapper: HTMLElement): HTMLElement {
        const lang = TranslinkLanguageController.getInstance();
        const footer = document.createElement('footer');
        footer.className = 'section-footer';

        const stats = document.createElement('div');
        stats.className = 'section-footer-stats';
        footer.appendChild(stats);

        const metadata = document.createElement('div');
        metadata.className = 'footer-metadata';
        metadata.innerHTML = `Translink / <span class="footer-section-name">${lang.t('global.system_active')}</span>`;
        footer.appendChild(metadata);

        appWrapper.appendChild(footer);
        return footer;
    }
}
