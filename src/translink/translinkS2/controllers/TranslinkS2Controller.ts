import '../styles/translinkS2-main.css';
import { TranslinkS2MainLayout } from '../sections/TranslinkS2MainLayout';
import { TranslinkS2Animator } from './TranslinkS2Animator';

export class TranslinkS2Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS2MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS2Animator().setup(parent);
        }, 100);
    }
}
