import { TranslinkS8Sidebar } from '../components/TranslinkS8Sidebar';
import { TranslinkS8MainContent } from '../components/TranslinkS8MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS8MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s8');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS8Sidebar().mount(container);
        new TranslinkS8MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
