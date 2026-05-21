import '../styles/translinkS4-main.css';
import { TranslinkS4MainLayout } from '../sections/TranslinkS4MainLayout';
import { TranslinkS4Animator } from './TranslinkS4Animator';

export class TranslinkS4Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS4MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS4Animator().setup(parent);
        }, 100);
    }
}
