import '../styles/translinkS7-main.css';
import { TranslinkS7MainLayout } from '../sections/TranslinkS7MainLayout';
import { TranslinkS7Animator } from './TranslinkS7Animator';

export class TranslinkS7Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS7MainLayout();
        layout.mount(parent);

        setTimeout(() => {
            new TranslinkS7Animator().setup(parent);
        }, 100);
    }
}
