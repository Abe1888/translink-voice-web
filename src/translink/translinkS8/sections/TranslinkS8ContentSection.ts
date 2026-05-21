export class TranslinkS8ContentSection {
    mount(parent: HTMLElement): void {
        const div = document.createElement('div');
        div.className = 'flex-1 flex flex-col overflow-hidden min-h-0 relative bg-transparent';
        div.innerHTML = `
            <div id="s8-scroll-content" class="w-full h-full p-[var(--hero-p-outer)] overflow-y-auto custom-scrollbar flex flex-col justify-center items-center relative">
            </div>
        `;
        parent.appendChild(div);
    }
}
