import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';

/**
 * TranslinkSectionFooter
 *
 * Persistent footer metadata for each section.
 * Refactored to use the .hud-metadata-mono semantic class and dynamically localized.
 */
const FOOTER_TRANSLATIONS: Record<string, Record<string, string>> = {
    'Hero Section Active': {
        am: 'የመነሻ ክፍል ንቁ',
        ar: 'القسم الرئيسي نشط',
    },
    'Precision Tracking System': {
        am: 'ትክክለኛ የክትትል ሥርዓት',
        ar: 'نظام التتبع الدقيق',
    },
    'Dynamic Route Sync': {
        am: 'ቀጣይነት ያለው የመንገድ ማመሳሰል',
        ar: 'مزامنة المسار الديناميكي',
    },
    'Telemetry Analytics Active': {
        am: 'የቴሌሜትሪ ትንታኔ ንቁ',
        ar: 'تحليلات التتبع نشطة',
    },
    'Vehicle Health Monitor': {
        am: 'የተሽከርካሪ ጤና መከታተያ',
        ar: 'مراقب صحة المركبة',
    },
    'Fuel Optimization Sync': {
        am: 'የነዳጅ ማመቻቸት ማመሳሰል',
        ar: 'مزامنة تحسين الوقود',
    },
    'Cloud Data Bridge': {
        am: 'የደመና መረጃ ድልድይ',
        ar: 'جسر بيانات السحاب',
    },
    'Fleet Logistics Core': {
        am: 'የመርከብ ሎጂስቲክስ እምብርት',
        ar: 'مركز لوجستيات الأسطول',
    },
    'Safety Awareness Stream': {
        am: 'የደህንነት ግንዛቤ ዥረት',
        ar: 'بث التوعية بالسلامة',
    },
    'Connected Network Hub': {
        am: 'የተገናኘ የአውታረ መረብ ማዕከል',
        ar: 'مركز الشبكة المتصلة',
    },
};

export class TranslinkSectionFooter {
    constructor(
        private id: string,
        private data: string
    ) {}

    mount(parent: HTMLElement): void {
        const footer = document.createElement('div');
        footer.id = `${this.id}-footer`;
        footer.className =
            'absolute bottom-[calc(var(--vh,1vh)*5)] left-1/2 -translate-x-1/2 w-full px-[4dvw] flex justify-between items-end pointer-events-none z-30';

        const lang = TranslinkLanguageController.getInstance().getLanguage();
        const translated = FOOTER_TRANSLATIONS[this.data]?.[lang] || this.data;

        footer.innerHTML = `
            <div></div>
            <div class="hud-metadata-mono text-right opacity-40 whitespace-nowrap">
                ${translated}
            </div>
        `;

        parent.appendChild(footer);
    }
}
