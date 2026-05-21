import '../styles/translinkS1-main.css';
import { TranslinkS1MainLayout } from '../sections/TranslinkS1MainLayout';
import { TranslinkS1HeroAnimator } from './TranslinkS1HeroAnimator';

export class TranslinkS1Controller {
    mount(parent: HTMLElement): void {
        const layout = new TranslinkS1MainLayout();
        layout.mount(parent);

        // Use rAF instead of setTimeout(50ms) to guarantee the section is
        // fully painted before the animator queries layout measurements.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const section =
                    parent.id === 's1' ? parent : (parent.querySelector('#s1') as HTMLElement);
                if (section) {
                    const animator = new TranslinkS1HeroAnimator();
                    animator.setup(section);
                }
            });
        });
    }
}
