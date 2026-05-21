import { TranslinkS5ContentSection } from '../sections/TranslinkS5ContentSection';
import { TranslinkS5Footer } from './TranslinkS5Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS5MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative h-full min-h-full';

        new TranslinkS5ContentSection().mount(main);

        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's5-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s5', 'TELEMETRY_S5').mount(telemetryWrapper);

        new TranslinkS5Footer().mount(main);

        parent.appendChild(main);
    }
}
