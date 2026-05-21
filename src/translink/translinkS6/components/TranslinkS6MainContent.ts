import { TranslinkS6ContentSection } from '../sections/TranslinkS6ContentSection';
import { TranslinkS6Footer } from './TranslinkS6Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS6MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative h-full min-h-full';

        new TranslinkS6ContentSection().mount(main);

        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's6-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s6', 'TELEMETRY_S6').mount(telemetryWrapper);

        new TranslinkS6Footer().mount(main);

        parent.appendChild(main);
    }
}
