/**
 * TranslinkSoundToggle - Global Audio Control
 *
 * Manages mute state and integrates with TruckAudioSystem and AmbientSoundscape.
 * Creates its own DOM element and mounts it to the specified container.
 */

import { TruckAudioSystem } from '@/translinkscene/systems/truckAudioSystem';
import { AmbientSoundscape } from '@/translinkscene/systems/audioSystem';

export class TranslinkSoundToggle {
    private button: HTMLElement | null = null;
    private isPlaying: boolean = false;
    private audioSystem: TruckAudioSystem;
    private ambientSoundscape: AmbientSoundscape;

    constructor() {
        // Retrieve singleton audio system
        this.audioSystem = TruckAudioSystem.getInstance();
        this.audioSystem.init();

        // Retrieve singleton ambient soundscape
        this.ambientSoundscape = AmbientSoundscape.getInstance();
        this.ambientSoundscape.init();
    }

    mount(parent: HTMLElement): void {
        this.button = document.createElement('button');
        this.button.id = 'global-sound-toggle';
        this.button.className =
            'fixed top-6 right-6 md:top-10 md:right-10 z-[var(--z-ui-global)] flex items-center justify-center transition-all duration-300 hover:scale-110 group cursor-pointer p-2';
        this.button.setAttribute('aria-label', 'Play Audio');
        this.button.setAttribute('aria-pressed', 'false');

        // Single "Weave" SVG structure that changes color based on state
        this.button.innerHTML = `
            <div class="sound-icon-container relative w-6 h-6 flex items-center justify-center transition-all duration-300">
                <svg class="sound-waves w-full h-full transition-all duration-500 ease-out" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 10v4"></path>
                    <path d="M6 7v10"></path>
                    <path d="M10 3v18"></path>
                    <path d="M14 8v8"></path>
                    <path d="M18 5v14"></path>
                    <path d="M22 10v4"></path>
                </svg>
            </div>
        `;

        this.button.addEventListener('click', () => this.toggle());

        parent.appendChild(this.button);
        this.updateButtonState();
    }

    toggle(): void {
        this.isPlaying = !this.isPlaying;
        this.audioSystem.setMuted(!this.isPlaying);
        this.ambientSoundscape.setMuted(!this.isPlaying);
        this.updateButtonState();
    }

    private updateButtonState(): void {
        if (!this.button) return;

        this.button.setAttribute('aria-pressed', this.isPlaying ? 'true' : 'false');
        this.button.setAttribute('aria-label', this.isPlaying ? 'Mute Audio' : 'Play Audio');

        const waves = this.button.querySelector('.sound-waves') as HTMLElement;

        if (this.isPlaying) {
            this.button.classList.add('is-playing');
            if (waves) {
                waves.style.stroke = 'var(--brand-obsidian)';
                waves.style.transform = 'scale(1)';
                waves.style.opacity = '1';
            }
        } else {
            this.button.classList.remove('is-playing');
            if (waves) {
                waves.style.stroke = 'var(--brand-crimson)';
                waves.style.transform = 'scale(0.85)'; // Subtle "shrunk" state for muted
                waves.style.opacity = '0.7';
            }
        }
    }

    enable(): void {
        this.isPlaying = true;
        this.audioSystem.setMuted(false);
        this.ambientSoundscape.setMuted(false);
        this.updateButtonState();
    }

    disable(): void {
        this.isPlaying = false;
        this.audioSystem.setMuted(true);
        this.ambientSoundscape.setMuted(true);
        this.updateButtonState();
    }
}
