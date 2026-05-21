import { TranslinkS4ContentSection } from '../sections/TranslinkS4ContentSection';
import { TranslinkS4Footer } from './TranslinkS4Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS4MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative h-full min-h-full';

        new TranslinkS4ContentSection().mount(main);

        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's4-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s4', 'TELEMETRY_S4').mount(telemetryWrapper);

        new TranslinkS4Footer().mount(main);

        parent.appendChild(main);
    }
}
