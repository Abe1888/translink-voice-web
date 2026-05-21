import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS4Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s4', 'Telemetry Analytics Active');
        footer.mount(parent);
    }
}
