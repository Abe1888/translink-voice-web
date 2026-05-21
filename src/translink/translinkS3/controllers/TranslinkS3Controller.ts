import '../styles/translinkS3-main.css';
import { TranslinkS3MainLayout } from '../sections/TranslinkS3MainLayout';
import { TranslinkS3Animator } from './TranslinkS3Animator';

export class TranslinkS3Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS3MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS3Animator().setup(parent);
        }, 100);
    }
}
