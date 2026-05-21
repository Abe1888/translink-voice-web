import '../styles/translinkS9-main.css';
import { TranslinkS9MainLayout } from '../sections/TranslinkS9MainLayout';
import { TranslinkS9Animator } from './TranslinkS9Animator';

export class TranslinkS9Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS9MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS9Animator().setup(parent);
        }, 100);
    }
}
