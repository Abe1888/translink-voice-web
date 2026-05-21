import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS5Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s5', 'Vehicle Health Monitor');
        footer.mount(parent);
    }
}
