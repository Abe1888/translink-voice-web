import { TranslinkSectionDecorations } from './TranslinkSectionDecorations';

/**
 * TranslinkGlobalDecorations
 *
 * Consolidates all decorative elements into a single global layer
 * that spans the full 1500dvh scroll height.
 *
 * This prevents conflicts between section boundaries and ensures
 * truly dramatic, unified parallax.
 */
export class TranslinkGlobalDecorations {
    private static instance: HTMLElement | null = null;

    static mount(parent: HTMLElement): void {
        if (this.instance) return;

        const globalLayer = document.createElement('div');
        globalLayer.id = 'global-deco-layer';
        // Ensure it spans the full height of the scrolling #app
        globalLayer.className =
            'absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible';

        // We need to know the heights of sections to place them correctly.
        // For simplicity, we'll assume the standard layout:
        // S1-S4: 100dvh each
        // S5: 400dvh
        // S6-S9: 100dvh each
        // S10: 300dvh
        // Total: 1500dvh

        const configs = [
            {
                id: 's1',
                top: 'calc(var(--vh, 1vh) * 0)',
                conf: { number: '01', showBgNumber: true, showHVLines: true, showGeo: true },
            },
            {
                id: 's2',
                top: 'calc(var(--vh, 1vh) * 100)',
                conf: { number: '02', showBgNumber: true, showHVLines: true, showGeo: true },
            },
            {
                id: 's3',
                top: 'calc(var(--vh, 1vh) * 200)',
                conf: { number: '03', showBgNumber: true, showHVLines: true, showGeo: true },
            },
            {
                id: 's4',
                top: 'calc(var(--vh, 1vh) * 300)',
                conf: { number: '04', showBgNumber: true, showHVLines: true, showGeo: true },
            },
            {
                id: 's5',
                top: 'calc(var(--vh, 1vh) * 400)',
                conf: {
                    number: '05',
                    showBgNumber: true,
                    showHVLines: true,
                    showGeo: true,
                    showGridBg: false,
                },
            },
            {
                id: 's6',
                top: 'calc(var(--vh, 1vh) * 800)',
                conf: { number: '06', showBgNumber: true, showHVLines: true, showGeo: true },
            },
            {
                id: 's7',
                top: 'calc(var(--vh, 1vh) * 900)',
                conf: { number: '07', showBgNumber: true, showHVLines: true, showGeo: true },
            },
            {
                id: 's8',
                top: 'calc(var(--vh, 1vh) * 1000)',
                conf: { number: '08', showBgNumber: true, showHVLines: true, showGeo: true },
            },
            {
                id: 's9',
                top: 'calc(var(--vh, 1vh) * 1100)',
                conf: { number: '09', showBgNumber: true, showHVLines: true, showGeo: true },
            },
            {
                id: 's10',
                top: 'calc(var(--vh, 1vh) * 1200)',
                conf: {
                    number: '10',
                    showBgNumber: true,
                    showHVLines: true,
                    showGeo: true,
                    showS10Grid: false,
                },
            },
        ];

        configs.forEach((cfg) => {
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'absolute w-full h-[calc(var(--vh,1vh)*100)]'; // Default section "window"
            if (cfg.id === 's5')
                sectionContainer.className = 'absolute w-full h-[calc(var(--vh,1vh)*400)]';
            if (cfg.id === 's10')
                sectionContainer.className = 'absolute w-full h-[calc(var(--vh,1vh)*300)]';

            sectionContainer.style.top = cfg.top;

            // Re-use the existing component to build the inner elements but mount them to this global child
            new TranslinkSectionDecorations(cfg.id, cfg.conf).mount(sectionContainer);
            globalLayer.appendChild(sectionContainer);
        });

        // Add to parent (usually #app)
        if (parent.firstChild) {
            parent.insertBefore(globalLayer, parent.firstChild);
        } else {
            parent.appendChild(globalLayer);
        }

        this.instance = globalLayer;
    }
}
