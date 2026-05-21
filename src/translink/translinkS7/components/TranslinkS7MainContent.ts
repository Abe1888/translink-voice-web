import { TranslinkS7ContentSection } from '../sections/TranslinkS7ContentSection';
import { TranslinkS7Footer } from './TranslinkS7Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS7MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative h-full min-h-full';

        new TranslinkS7ContentSection().mount(main);

        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's7-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s7', 'TELEMETRY_S7').mount(telemetryWrapper);

        new TranslinkS7Footer().mount(main);

        parent.appendChild(main);
    }
}
