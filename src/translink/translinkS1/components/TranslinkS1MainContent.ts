import { TranslinkS1HeroSection } from '../sections/TranslinkS1HeroSection';
import { TranslinkS1Footer } from './TranslinkS1Footer';

export class TranslinkS1MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative z-10';

        new TranslinkS1HeroSection().mount(main);

        new TranslinkS1Footer().mount(main);

        parent.appendChild(main);
    }
}
