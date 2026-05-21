import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';

export class TranslinkLanguageToggle {
    private button: HTMLElement | null = null;
    private langController: TranslinkLanguageController;

    constructor() {
        this.langController = TranslinkLanguageController.getInstance();
    }

    mount(parent: HTMLElement): void {
        const enabledLangs = this.langController.getEnabledLanguages();
        if (enabledLangs.length <= 1) {
            return; // Completely hide from UI if only 1 language is enabled
        }

        this.button = document.createElement('button');
        this.button.id = 'global-language-toggle';
        // Positioned slightly to the left of the SoundToggle
        this.button.className =
            'fixed top-6 right-20 md:top-10 md:right-24 z-[var(--z-ui-global)] flex items-center justify-center transition-all duration-300 hover:scale-110 group cursor-pointer p-2';
        this.button.setAttribute('aria-label', 'Toggle Language');

        const currentLang = this.langController.getLanguage();
        const currentIndex = enabledLangs.indexOf(currentLang);
        const nextIndex = (currentIndex + 1) % enabledLangs.length;
        const nextLang = enabledLangs[nextIndex];
        const displayLang = nextLang.toUpperCase();

        this.button.innerHTML = `
            <div class="lang-icon-container relative w-8 h-8 flex items-center justify-center transition-all duration-300 rounded-full border-2 border-primary/20 hover:border-primary">
                <span class="text-xs font-bold text-primary tracking-widest uppercase">
                    ${displayLang}
                </span>
            </div>
        `;

        this.button.addEventListener('click', () => {
            this.langController.toggleLanguage();
        });

        parent.appendChild(this.button);
    }
}
