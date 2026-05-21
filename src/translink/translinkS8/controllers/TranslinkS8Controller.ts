import '../styles/translinkS8-main.css';
import { TranslinkS8MainLayout } from '../sections/TranslinkS8MainLayout';
import { TranslinkS8Animator } from './TranslinkS8Animator';

export class TranslinkS8Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS8MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS8Animator().setup(parent);
        }, 100);
    }
}
