import { TranslinkS10Sidebar } from '../components/TranslinkS10Sidebar';
import { TranslinkS10MainContent } from '../components/TranslinkS10MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS10MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s10');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS10Sidebar().mount(container);
        new TranslinkS10MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
