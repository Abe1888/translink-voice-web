import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS6Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s6', 'Fuel Optimization Sync');
        footer.mount(parent);
    }
}
