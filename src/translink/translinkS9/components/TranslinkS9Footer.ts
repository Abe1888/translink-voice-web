import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS9Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s9', 'Safety Awareness Stream');
        footer.mount(parent);
    }
}
