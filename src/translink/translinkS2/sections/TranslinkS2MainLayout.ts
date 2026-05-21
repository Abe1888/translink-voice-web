import { TranslinkS2Sidebar } from '../components/TranslinkS2Sidebar';
import { TranslinkS2MainContent } from '../components/TranslinkS2MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS2MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s2');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS2Sidebar().mount(container);
        new TranslinkS2MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
