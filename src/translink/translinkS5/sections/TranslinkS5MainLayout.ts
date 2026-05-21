import { TranslinkS5Sidebar } from '../components/TranslinkS5Sidebar';
import { TranslinkS5MainContent } from '../components/TranslinkS5MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS5MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s5');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS5Sidebar().mount(container);
        new TranslinkS5MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
