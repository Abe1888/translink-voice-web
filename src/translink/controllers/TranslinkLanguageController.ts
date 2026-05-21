import langData from '../../translinkconfig/language_config.json';

export type Language = 'en' | 'am' | 'ar';

export class TranslinkLanguageController {
    private static instance: TranslinkLanguageController;
    private currentLang: Language = 'en';
    private config: any = langData;

    public static getInstance(): TranslinkLanguageController {
        if (!TranslinkLanguageController.instance) {
            TranslinkLanguageController.instance = new TranslinkLanguageController();
        }
        return TranslinkLanguageController.instance;
    }

    private constructor() {
        // Retrieve saved language or default to the first enabled one
        const enabledLangs = this.getEnabledLanguages();
        const savedLang = localStorage.getItem('translink_lang') as Language;
        if (enabledLangs.includes(savedLang)) {
            this.currentLang = savedLang;
        } else {
            this.currentLang = enabledLangs[0];
            localStorage.setItem('translink_lang', this.currentLang);
        }
        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
    }

    public getEnabledLanguages(): Language[] {
        const langStatus = this.config.languages || { EN: 1, AM: 1, AR: 0 };
        const enabled: Language[] = [];
        if (langStatus.EN === 1) enabled.push('en');
        if (langStatus.AM === 1) enabled.push('am');
        if (langStatus.AR === 1) enabled.push('ar');
        if (enabled.length === 0) enabled.push('en'); // Safety fallback
        return enabled;
    }

    public getLanguage(): Language {
        return this.currentLang;
    }

    public setLanguage(lang: Language): void {
        const enabledLangs = this.getEnabledLanguages();
        if (!enabledLangs.includes(lang)) return; // Safety check
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        localStorage.setItem('translink_lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Dispatch an event so components can re-render or update text
        window.dispatchEvent(new CustomEvent('translink:language-change', { detail: { lang } }));

        // As a fallback for complex static DOM, reload the page to apply translations
        // if dynamic updating proves too complex for the current architecture.
        window.location.reload();
    }

    public toggleLanguage(): void {
        const enabledLangs = this.getEnabledLanguages();
        if (enabledLangs.length <= 1) return;
        const currentIndex = enabledLangs.indexOf(this.currentLang);
        const nextIndex = (currentIndex + 1) % enabledLangs.length;
        this.setLanguage(enabledLangs[nextIndex]);
    }

    /**
     * Get a translated string using dot notation (e.g., 'global.telemetry' or 'sections.s1.popup_title')
     */
    public t(key: string): string {
        const keys = key.split('.');
        let current: any = this.config[this.currentLang];

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                console.warn(`[I18N] Key not found: ${key} for lang: ${this.currentLang}`);
                return key; // Fallback to the key itself
            }
        }

        return current as string;
    }

    /**
     * Get array of translated tags
     */
    public tArray(key: string): string[] {
        const val = this.t(key);
        if (Array.isArray(val)) return val;
        return [];
    }
}
