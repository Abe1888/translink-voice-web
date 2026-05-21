import { TranslinkS8ContentSection } from '../sections/TranslinkS8ContentSection';
import { TranslinkS8Footer } from './TranslinkS8Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS8MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative h-full min-h-full';

        new TranslinkS8ContentSection().mount(main);

        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's8-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s8', 'TELEMETRY_S8').mount(telemetryWrapper);

        new TranslinkS8Footer().mount(main);

        parent.appendChild(main);
    }
}
