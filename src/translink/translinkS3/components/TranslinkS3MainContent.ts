import { TranslinkS3ContentSection } from '../sections/TranslinkS3ContentSection';
import { TranslinkS3Footer } from './TranslinkS3Footer';
import { TranslinkTelemetryButton } from '../../components/TranslinkTelemetryButton';

export class TranslinkS3MainContent {
    mount(parent: HTMLElement): void {
        const main = document.createElement('main');
        main.className =
            'w-[var(--content-width)] flex-none flex flex-col overflow-visible shrink-0 relative z-10';

        new TranslinkS3ContentSection().mount(main);

        const telemetryWrapper = document.createElement('div');
        telemetryWrapper.id = 's3-telemetry-mount';
        telemetryWrapper.className = 'absolute bottom-8 left-0 z-30';
        main.appendChild(telemetryWrapper);

        new TranslinkTelemetryButton('s3', 'TELEMETRY_S3').mount(telemetryWrapper);

        new TranslinkS3Footer().mount(main);

        parent.appendChild(main);
    }
}
