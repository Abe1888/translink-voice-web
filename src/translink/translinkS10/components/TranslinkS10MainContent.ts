import { TranslinkS10ContentSection } from '../sections/TranslinkS10ContentSection';
import { TranslinkS10Footer } from './TranslinkS10Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS10MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative h-full min-h-full';

        new TranslinkS10ContentSection().mount(main);

        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's10-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s10', 'TELEMETRY_S10').mount(telemetryWrapper);

        new TranslinkS10Footer().mount(main);

        parent.appendChild(main);
    }
}
