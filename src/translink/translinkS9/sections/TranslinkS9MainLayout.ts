import { TranslinkS9Sidebar } from '../components/TranslinkS9Sidebar';
import { TranslinkS9MainContent } from '../components/TranslinkS9MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS9MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s9');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS9Sidebar().mount(container);
        new TranslinkS9MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
