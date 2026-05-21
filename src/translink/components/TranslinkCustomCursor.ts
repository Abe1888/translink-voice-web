/**
 * TranslinkCustomCursor
 *
 * Injects the cursor dot and ring into the DOM.
 */
export class TranslinkCustomCursor {
    mount(parent: HTMLElement = document.body): void {
        // Dot
        const dot = document.createElement('div');
        dot.id = 'cursor-dot';
        parent.appendChild(dot);

        // Ring
        const ring = document.createElement('div');
        ring.id = 'cursor-ring';
        parent.appendChild(ring);
    }
}
