import { TranslinkS2ContentSection } from '../sections/TranslinkS2ContentSection';
import { TranslinkS2Footer } from './TranslinkS2Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS2MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative h-full min-h-full';

        new TranslinkS2ContentSection().mount(main);

        // Relocated Telemetry Button: Bottom-left of main content, next to the divider path
        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's2-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s2', 'TELEMETRY_S2').mount(telemetryWrapper);

        new TranslinkS2Footer().mount(main);

        parent.appendChild(main);
    }
}
