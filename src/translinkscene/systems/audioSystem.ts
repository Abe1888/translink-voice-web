/**
 * AmbientSoundscape - Scroll-Synced Ambient Audio
 *
 * Audio playback position is derived from scroll progress (0-100%)
 * Volume follows predefined keyframes mapped to scroll positions.
 */

import ambientUrl from '../assets/audio/immersive-relaxation.mp3?url';
import { AudioCore } from './AudioCore';

export interface SoundscapeConfig {
    fadeInDuration: number;
    fadeOutDuration: number;
    smoothingFactor: number;
}

const DEFAULT_CONFIG: SoundscapeConfig = {
    fadeInDuration: 2,
    fadeOutDuration: 2,
    smoothingFactor: 0.15,
};

// Volume keyframes: [scroll%, volume%]
// Updated to match actual 8-section structure (1000vh total)
const VOLUME_KEYFRAMES: [number, number][] = [
    [0.0, 0.15], // Flat 15% volume Start
    [1.0, 0.15], // Flat 15% volume End
];

export class AmbientSoundscape {
    private static instance: AmbientSoundscape;

    public static getInstance(): AmbientSoundscape {
        if (!AmbientSoundscape.instance) {
            AmbientSoundscape.instance = new AmbientSoundscape();
        }
        return AmbientSoundscape.instance;
    }

    private ctx: AudioContext | null = null;

    private masterGain: GainNode | null = null;
    private source: AudioBufferSourceNode | null = null;
    private buffer: AudioBuffer | null = null;

    // PERF FIX: Raw bytes cached at init (no AudioContext needed to fetch).
    // Decoded once in the real AudioContext on first user gesture.
    private rawAudioBuffer: ArrayBuffer | null = null;

    private initialized = false;
    private unlocked = false;
    private playing = false;
    private muted = false;
    private config: SoundscapeConfig;

    // Scroll-sync state
    private currentProgress = 0;
    private audioDuration = 0;
    private fadeInEndTime = 0;

    // Volume interpolation
    private currentVolume = 0;
    private targetVolume = 0;

    constructor(config: Partial<SoundscapeConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    init(): void {
        if (this.initialized) return;
        this.initialized = true;

        this.preloadBuffer();

        const unlock = async () => {
            const success = await AudioCore.getInstance().unlock();
            if (success) this.unlock();
        };

        // iOS/Safari fix: passive listeners can sometimes prevent proper audio initialization.
        // We use active listeners to ensure the gesture is recognized for the AudioContext.
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
        document.addEventListener('mousedown', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });

        console.log('[AmbientSoundscape] Initialized');
    }

    /**
     * Preload phase: fetch raw bytes only, no AudioContext or decoding.
     * Keeps memory clean before user gesture.
     */
    private async preloadBuffer(): Promise<void> {
        try {
            const res = await fetch(ambientUrl);
            if (!res.ok) return;
            this.rawAudioBuffer = await res.arrayBuffer();
            console.log(
                '[AmbientSoundscape] Raw bytes preloaded (awaiting user gesture to decode)'
            );
        } catch (e) {
            console.warn('[AmbientSoundscape] Preload failed:', e);
        }
    }

    private async unlock(): Promise<void> {
        if (this.unlocked) return;

        try {
            this.ctx = AudioCore.getInstance().getContext();

            if (this.ctx.state !== 'running') return;

            this.unlocked = true;

            if (!this.buffer) {
                await this.loadBuffer();
            }

            if (this.buffer) {
                this.buildAudioGraph();
                this.startAtProgress(this.currentProgress);
                console.log(
                    `[AmbientSoundscape] Unlocked at ${(this.currentProgress * 100).toFixed(0)}%`
                );
            }
        } catch (e) {
            console.warn('[AmbientSoundscape] Unlock failed:', e);
        }
    }

    /**
     * Decode phase: called after AudioContext is unlocked on user gesture.
     * Uses the real ctx — single decode, zero duplication.
     */
    private async loadBuffer(): Promise<void> {
        if (!this.ctx) return;

        try {
            if (this.rawAudioBuffer) {
                // Fast path: decode from pre-fetched bytes
                this.buffer = await this.ctx.decodeAudioData(this.rawAudioBuffer.slice(0));
                this.rawAudioBuffer = null; // Free raw bytes
            } else {
                // Fallback: fetch + decode in one step
                const res = await fetch(ambientUrl);
                if (!res.ok) return;
                this.buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
            }
            this.audioDuration = this.buffer.duration;
            console.log(`[AmbientSoundscape] Decoded: ${this.audioDuration.toFixed(1)}s`);
        } catch (e) {
            console.warn('[AmbientSoundscape] Decode failed:', e);
        }
    }

    private buildAudioGraph(): void {
        if (!this.ctx) return;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
    }

    private startAtProgress(progress: number): void {
        if (!this.ctx || !this.buffer || !this.masterGain || this.playing) return;

        const now = this.ctx.currentTime;
        const offset = progress * this.audioDuration;

        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = true;
        this.source.connect(this.masterGain);
        this.source.start(now, offset);

        // Start at keyframe volume for current progress
        this.currentVolume = this.getVolumeAtProgress(progress);
        this.masterGain.gain.linearRampToValueAtTime(
            this.currentVolume,
            now + this.config.fadeInDuration
        );

        this.fadeInEndTime = now + this.config.fadeInDuration;
        this.playing = true;
    }

    /**
     * Interpolate volume from keyframes based on scroll progress
     */
    private getVolumeAtProgress(progress: number): number {
        const p = Math.max(0, Math.min(1, progress));

        // Find surrounding keyframes
        let lower = VOLUME_KEYFRAMES[0];
        let upper = VOLUME_KEYFRAMES[VOLUME_KEYFRAMES.length - 1];

        for (let i = 0; i < VOLUME_KEYFRAMES.length - 1; i++) {
            if (p >= VOLUME_KEYFRAMES[i][0] && p <= VOLUME_KEYFRAMES[i + 1][0]) {
                lower = VOLUME_KEYFRAMES[i];
                upper = VOLUME_KEYFRAMES[i + 1];
                break;
            }
        }

        // Linear interpolation between keyframes
        const range = upper[0] - lower[0];
        if (range === 0) return lower[1];

        const t = (p - lower[0]) / range;
        return lower[1] + (upper[1] - lower[1]) * t;
    }

    /**
     * Update with scroll progress
     */
    update(progress: number, _cameraDistance: number = 0.5, _cameraVelocity: number = 0): void {
        this.currentProgress = progress;

        if (!this.ctx || !this.masterGain || !this.playing || this.muted) return;

        const now = this.ctx.currentTime;

        // Protect the initial fade-in ramp from getting overridden by scroll updates
        if (now < this.fadeInEndTime) {
            this.targetVolume = this.getVolumeAtProgress(progress);
            this.currentVolume = this.targetVolume; // Keep state synced for when fade ends
            return;
        }

        // Get target volume from keyframes
        this.targetVolume = this.getVolumeAtProgress(progress);

        // Smooth interpolation
        const smoothing = this.config.smoothingFactor;
        this.currentVolume += (this.targetVolume - this.currentVolume) * smoothing;

        this.masterGain.gain.setTargetAtTime(this.currentVolume, now, 0.05);
    }

    setVolume(_volume: number): void {
        // No-op - volume controlled by keyframes
    }

    setMuted(muted: boolean): void {
        this.muted = muted;

        if (!this.ctx || !this.masterGain) return;

        const now = this.ctx.currentTime;
        const targetVol = muted ? 0 : this.currentVolume;
        const duration = muted ? this.config.fadeOutDuration : this.config.fadeInDuration;

        this.masterGain.gain.linearRampToValueAtTime(targetVol, now + duration);
    }

    duck(amount: number = 0.5, duration: number = 0.5): void {
        if (!this.ctx || !this.masterGain || !this.playing) return;

        const now = this.ctx.currentTime;
        const duckedVol = this.currentVolume * (1 - amount);

        this.masterGain.gain.setTargetAtTime(duckedVol, now, 0.05);
        this.masterGain.gain.setTargetAtTime(this.currentVolume, now + duration, 0.3);
    }

    isPlaying(): boolean {
        return this.playing && this.unlocked;
    }

    dispose(): void {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0, now + this.config.fadeOutDuration);
        }

        setTimeout(
            () => {
                try {
                    this.source?.stop();
                } catch (error) {
                    // Ignore errors during cleanup
                    console.debug('[AmbientSoundscape] Source stop error:', error);
                }
                this.ctx?.close();
                this.ctx = null;
                this.playing = false;
                this.unlocked = false;
                this.initialized = false;
            },
            this.config.fadeOutDuration * 1000 + 100
        );
    }
}
