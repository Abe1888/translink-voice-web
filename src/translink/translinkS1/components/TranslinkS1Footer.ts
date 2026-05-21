import { TranslinkSectionFooter } from '../../components/TranslinkSectionFooter';

/**
 * TranslinkS1Footer
 *
 * Section 1 specific footer.
 * Migrated to the new .mount() pattern.
 */
export class TranslinkS1Footer {
    mount(parent: HTMLElement): void {
        const footer = new TranslinkSectionFooter('s1', 'Hero Section Active');
        footer.mount(parent);
    }
}
