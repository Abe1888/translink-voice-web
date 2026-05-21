import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

export class TranslinkS3Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s3', 'Dynamic Route Sync');
        footer.mount(parent);
    }
}
