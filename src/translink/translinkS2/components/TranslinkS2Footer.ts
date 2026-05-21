import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS2Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s2', 'Precision Tracking System');
        footer.mount(parent);
    }
}
