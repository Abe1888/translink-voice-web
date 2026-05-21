import { TranslinkS6Sidebar } from '../components/TranslinkS6Sidebar';
import { TranslinkS6MainContent } from '../components/TranslinkS6MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS6MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s6');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS6Sidebar().mount(container);
        new TranslinkS6MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
