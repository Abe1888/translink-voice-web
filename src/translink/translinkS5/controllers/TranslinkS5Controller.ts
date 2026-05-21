import '../styles/translinkS5-main.css';
import { TranslinkS5MainLayout } from '../sections/TranslinkS5MainLayout';
import { TranslinkS5Animator } from './TranslinkS5Animator';

export class TranslinkS5Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS5MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS5Animator().setup(parent);
        }, 100);
    }
}
