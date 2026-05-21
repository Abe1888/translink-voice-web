import '../styles/translinkS6-main.css';
import { TranslinkS6MainLayout } from '../sections/TranslinkS6MainLayout';
import { TranslinkS6Animator } from './TranslinkS6Animator';

export class TranslinkS6Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS6MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS6Animator().setup(parent);
        }, 100);
    }
}
