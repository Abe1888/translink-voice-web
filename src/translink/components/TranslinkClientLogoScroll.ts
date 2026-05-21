import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';

const CLIENT_LOGOS = [
    { src: 'airlines.png', alt: 'AIRLINES' },
    { src: 'dbe.png', alt: 'DBE' },
    { src: 'moenco.png', alt: 'MOENCO' },
    { src: 'jti.png', alt: 'JTI' },
    { src: 'bgi.png', alt: 'BGI' },
    { src: 'safari.png', alt: 'SAFARICOM' },
    { src: 'habesha.png', alt: 'HABESHA' },
    { src: 'orda.png', alt: 'ORDA' },
    { src: 'midroc.png', alt: 'MIDROC' },
    { src: 'pepsico.svg', alt: 'PEPSICO' },
    { src: 'agp.png', alt: 'AGP' },
    { src: 'crs.svg', alt: 'CRS' },
    { src: 'ghion.svg', alt: 'GHION' },
    { src: 'heineken.svg', alt: 'HEINEKEN' },
    { src: 'msf.png', alt: 'MSF' },
    { src: 'taf.png', alt: 'TAF' },
    { src: 'unilever.svg', alt: 'UNILEVER' },
];

export class TranslinkClientLogoScroll {
    private container: HTMLElement | null = null;

    mount(parent: HTMLElement): void {
        this.container = document.createElement('div');
        this.container.className = 'global-client-logo-column';

        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'logo-scroll-container';

        // Reverse the marquee loop direction dynamically in Arabic (RTL) for mirroring alignment
        const isRtl = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        if (isRtl) {
            scrollContainer.style.animationDirection = 'reverse';
        }

        // Create 3x logos for perfect mathematical loop (300% height)
        const allLogos = [...CLIENT_LOGOS, ...CLIENT_LOGOS, ...CLIENT_LOGOS];

        allLogos.forEach((logo) => {
            const item = document.createElement('div');
            item.className = 'global-client-logo-item mb-10'; // mb-10 reduces the previous mb-16 gap by 40%

            const img = document.createElement('img');
            img.src = `./images/clients/${logo.src}`;
            img.alt = logo.alt;
            img.className = 'w-full h-auto object-contain px-2'; // Ensures auto-fit to column width with slight padding
            img.loading = 'lazy';

            item.appendChild(img);
            scrollContainer.appendChild(item);
        });

        this.container.appendChild(scrollContainer);
        parent.appendChild(this.container);
    }

    destroy(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
