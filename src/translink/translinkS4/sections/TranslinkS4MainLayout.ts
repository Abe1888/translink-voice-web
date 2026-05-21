import { TranslinkS4Sidebar } from '../components/TranslinkS4Sidebar';
import { TranslinkS4MainContent } from '../components/TranslinkS4MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS4MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s4');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS4Sidebar().mount(container);
        new TranslinkS4MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
