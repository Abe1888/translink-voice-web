import '../styles/translinkS10-main.css';
import { TranslinkS10MainLayout } from '../sections/TranslinkS10MainLayout';
import { TranslinkS10Animator } from './TranslinkS10Animator';

export class TranslinkS10Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS10MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS10Animator().setup(parent);
        }, 100);
    }
}
