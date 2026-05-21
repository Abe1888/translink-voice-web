import { TranslinkS3Sidebar } from '../components/TranslinkS3Sidebar';
import { TranslinkS3MainContent } from '../components/TranslinkS3MainContent';
import { TranslinkSectionLayout } from '../../components/TranslinkSectionLayout';

export class TranslinkS3MainLayout {
    mount(parent: HTMLElement): void {
        const appWrapper = TranslinkSectionLayout.createWrapper('s3');
        const container = appWrapper.querySelector('.flex-1') as HTMLElement;

        new TranslinkS3Sidebar().mount(container);
        new TranslinkS3MainContent().mount(container);

        TranslinkSectionLayout.addNavGutter(container);
        TranslinkSectionLayout.addFooter(appWrapper);

        parent.appendChild(appWrapper);
    }
}
