import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS10Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s10', 'Connected Network Hub');
        footer.mount(parent);
    }
}
