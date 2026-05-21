/**
 * TranslinkS10ContentSection
 *
 * Standardized to the Centralized Theme System.
 */
export class TranslinkS10ContentSection {
    mount(parent: HTMLElement): void {
        const div = document.createElement('div');
        div.className = 'flex-1 flex flex-col overflow-hidden min-h-0 relative bg-transparent';
        div.innerHTML = `
        <div id="s10-scroll-content" class="w-full h-full p-[var(--hero-p-outer)] flex flex-col justify-center items-center text-center relative z-10">

        </div>
        `;
        parent.appendChild(div);
    }
}
