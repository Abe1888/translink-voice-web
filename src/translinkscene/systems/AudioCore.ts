/**
 * AudioCore - Unified Audio Engine for Translink
 *
 * Provides a single, authoritative AudioContext shared across all systems.
 * Handles the strict "User Gesture" unlock requirements for mobile browsers (iOS/Android).
 */

export class AudioCore {
    private static instance: AudioCore;
    private ctx: AudioContext | null = null;
    private unlocked = false;
    private unlockListeners: (() => void)[] = [];

    public static getInstance(): AudioCore {
        if (!AudioCore.instance) {
            AudioCore.instance = new AudioCore();
        }
        return AudioCore.instance;
    }

    /**
     * Get the shared AudioContext.
     * Lazily created on the first call (should be called within a user gesture).
     */
    public getContext(): AudioContext {
        if (!this.ctx) {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            if (!AC) {
                console.error('[AudioCore] Web Audio API not supported in this browser.');
                // Fallback to a dummy context to prevent crashes if needed,
                // but real apps should handle the error.
                this.ctx = {} as AudioContext;
            } else {
                this.ctx = new AC();
            }
        }
        return this.ctx;
    }

    /**
     * Authority for unlocking audio on mobile.
     * Must be called from a click/touchstart handler.
     */
    public async unlock(): Promise<boolean> {
        if (this.unlocked) return true;

        const ctx = this.getContext();

        try {
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            // Silent "Kick" for iOS Safari.
            // On iOS, sometimes resume() is not enough; you must actually play a buffer
            // inside the event handler to truly enable audio output.
            if (ctx.state === 'running') {
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);

                this.unlocked = true;
                console.log('[AudioCore] AudioContext Unlocked & Warmed Up');

                // Notify any listeners (like systems waiting for a context)
                this.unlockListeners.forEach((cb) => cb());
                this.unlockListeners = [];

                return true;
            }
        } catch (e) {
            console.warn('[AudioCore] Unlock failed:', e);
        }

        return false;
    }

    public isUnlocked(): boolean {
        return this.unlocked && this.ctx?.state === 'running';
    }

    public onUnlocked(callback: () => void): void {
        if (this.isUnlocked()) {
            callback();
        } else {
            this.unlockListeners.push(callback);
        }
    }
}
