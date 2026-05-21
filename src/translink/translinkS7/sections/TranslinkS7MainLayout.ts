import { TranslinkS7Sidebar } from '../components/TranslinkS7Sidebar';
import { TranslinkS7MainContent } from '../components/TranslinkS7MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS7MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s7');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS7Sidebar().mount(container);
        new TranslinkS7MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
