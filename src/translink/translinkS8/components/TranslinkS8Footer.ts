import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS8Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s8', 'Fleet Logistics Core');
        footer.mount(parent);
    }
}
