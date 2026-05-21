import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS7Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s7', 'Cloud Data Bridge');
        footer.mount(parent);
    }
}
