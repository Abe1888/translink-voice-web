import { TranslinkS1Sidebar } from '../components/TranslinkS1Sidebar';
import { TranslinkS1MainContent } from '../components/TranslinkS1MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS1MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s1');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS1Sidebar().mount(container);
        new TranslinkS1MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
