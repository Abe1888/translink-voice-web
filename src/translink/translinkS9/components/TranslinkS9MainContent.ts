import { TranslinkS9ContentSection } from '../sections/TranslinkS9ContentSection';
import { TranslinkS9Footer } from './TranslinkS9Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS9MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative h-full min-h-full';

        new TranslinkS9ContentSection().mount(main);

        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's9-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s9', 'TELEMETRY_S9').mount(telemetryWrapper);

        new TranslinkS9Footer().mount(main);

        parent.appendChild(main);
    }
}
