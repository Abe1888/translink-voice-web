/**
 * TruckAudioSystem - Scroll-Bound Audio for S4-1b Section
 *
 * STRICT SCROLL-BOUND TRIGGERS:
 * - 09%: Swoosh orbit (harness)
 * - 36%: Swoosh orbit (tank)
 * - 48%: Truck audio section entry
 * - 49%: Air brake hiss (one-shot)
 * - 51%: Engine start sequence
 * - 52%: Engine idle loop
 * - 53%: Horn blast
 * - 65%-68%: Fade out
 * - 85%: Swoosh orbit (exit)
 */

import swoosh09Url from '../assets/audio/swoosh-orbit-3.mp3?url';
import swoosh36Url from '../assets/audio/swoosh-orbit-2.mp3?url';
import swoosh85Url from '../assets/audio/swoosh-orbit.mp3?url';
import engineStartUrl from '../assets/audio/Truck-Engine-Start.mp3?url';
import engineRunUrl from '../assets/audio/Truck-Engine-Run.mp3?url';
import airBrakeUrl from '../assets/audio/Truck-Recycling-Air_Brake-Foot_Pedal.mp3?url';
import { AudioCore } from './AudioCore';

const SECTION_START = 0.35; // Expanded to 35% to include Fuel Tank orbit swoosh
const SECTION_END = 0.68;
const FADE_OUT_START = 0.65; // Start fading out at 65%
const FADE_OUT_END = 0.68; // Complete fade by 68%

const TRIGGER_SWOOSH_09 = 0.09; // Harness transition swoop
const TRIGGER_SWOOSH_36 = 0.36; // Fuel Tank orbit motion
const TRIGGER_SWOOSH_85 = 0.85; // Filter orbit motion
const TRIGGER_AIR_BRAKE = 0.49;
const TRIGGER_ENGINE_START = 0.51;
const TRIGGER_ENGINE_IDLE = 0.52;
const TRIGGER_HORN = 0.53;

export class TruckAudioSystem {
    private static instance: TruckAudioSystem;

    public static getInstance(): TruckAudioSystem {
        if (!TruckAudioSystem.instance) {
            TruckAudioSystem.instance = new TruckAudioSystem();
        }
        return TruckAudioSystem.instance;
    }

    private ctx: AudioContext | null = null;

    private masterGain: GainNode | null = null;
    private swooshGain: GainNode | null = null; // Independent volume for global swooshes

    private swoosh09Buffer: AudioBuffer | null = null;
    private swoosh36Buffer: AudioBuffer | null = null;
    private swoosh85Buffer: AudioBuffer | null = null;
    private engineStartBuffer: AudioBuffer | null = null;
    private engineRunBuffer: AudioBuffer | null = null;
    private airBrakeBuffer: AudioBuffer | null = null;

    // PERF FIX: Raw ArrayBuffers cached during preload phase (before user gesture).
    // Decoded once into AudioBuffers when the real AudioContext is created on unlock.
    // Eliminates the dual-AudioContext decode leak (old code decoded twice).
    // Elements are nullable because individual fetches may fail gracefully.
    private rawBuffers: (ArrayBuffer | null)[] | null = null;

    private engineRunSource: AudioBufferSourceNode | null = null;
    private engineRunGain: GainNode | null = null;
    private hornOsc1: OscillatorNode | null = null;
    private hornOsc2: OscillatorNode | null = null;
    private hornGain: GainNode | null = null;

    private initialized = false;
    private unlocked = false;
    private buffersLoaded = false;
    private engineRunning = false;
    private muted = false;
    private targetVolume = 0.4;

    private airBrakeFired = false;
    private engineStartFired = false;
    private engineIdleFired = false;
    private hornFired = false;

    private pendingAirBrake = false;
    private pendingEngine = false;
    private pendingIdle = false;
    private pendingHorn = false;

    private lastProgress = 0;
    private unlockAttempted = false;

    init(): void {
        if (this.initialized) return;
        this.initialized = true;

        this.preloadBuffers();

        const unlock = async () => {
            if (this.unlockAttempted) return;
            this.unlockAttempted = true;
            const success = await AudioCore.getInstance().unlock();
            if (success) this.unlockAudio();
        };

        // iOS/Safari fix: passive listeners can sometimes prevent proper audio initialization.
        // We use active listeners to ensure the gesture is recognized for the AudioContext.
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
        document.addEventListener('mousedown', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });

        console.log('[TruckAudio] Initialized - preloading and waiting for user gesture');
    }

    private async unlockAudio(): Promise<void> {
        if (this.unlocked) return;

        try {
            this.ctx = AudioCore.getInstance().getContext();

            if (this.ctx.state !== 'running') return;

            this.unlocked = true;

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.ctx.destination);

            this.swooshGain = this.ctx.createGain();
            this.swooshGain.gain.value = 0.55; // Boosted volume for swooshes
            this.swooshGain.connect(this.ctx.destination);

            if (!this.buffersLoaded) {
                await this.loadBuffers();
            }

            console.log('[TruckAudio] Unlocked and ready');
            this.firePendingIfValid();
        } catch (e) {
            console.warn('[TruckAudio] Unlock failed:', e);
        }
    }

    /**
     * Preload phase (called at init, before user gesture).
     * Fetches raw audio bytes and caches them as ArrayBuffers.
     * NO AudioContext or decoding happens here — browsers block that before a gesture.
     */
    private async preloadBuffers(): Promise<void> {
        try {
            const fetchRaw = async (url: string): Promise<ArrayBuffer | null> => {
                try {
                    const res = await fetch(url);
                    return res.ok ? await res.arrayBuffer() : null;
                } catch {
                    return null;
                }
            };

            const results = await Promise.all([
                fetchRaw(swoosh09Url),
                fetchRaw(swoosh36Url),
                fetchRaw(swoosh85Url),
                fetchRaw(engineStartUrl),
                fetchRaw(engineRunUrl),
                fetchRaw(airBrakeUrl),
            ]);

            // Store raw bytes — decoding happens in loadBuffers() once ctx is available
            this.rawBuffers = results;
            console.log('[TruckAudio] Raw bytes preloaded (awaiting user gesture to decode)');
        } catch (e) {
            console.warn('[TruckAudio] Preload failed', e);
        }
    }

    /**
     * Decode phase (called after AudioContext is unlocked on user gesture).
     * Uses the real AudioContext to decode — single decode, zero duplication.
     */
    private async loadBuffers(): Promise<void> {
        if (!this.ctx || this.buffersLoaded) return;

        const decode = async (raw: ArrayBuffer | null): Promise<AudioBuffer | null> => {
            if (!raw) return null;
            try {
                // ArrayBuffer is consumed by decodeAudioData — clone to be safe if reused
                return await this.ctx!.decodeAudioData(raw.slice(0));
            } catch {
                return null;
            }
        };

        if (this.rawBuffers) {
            // Fast path: decode from pre-fetched bytes
            const [swoosh09, swoosh36, swoosh85, start, run, brake] = await Promise.all(
                this.rawBuffers.map(decode)
            );
            this.swoosh09Buffer = swoosh09;
            this.swoosh36Buffer = swoosh36;
            this.swoosh85Buffer = swoosh85;
            this.engineStartBuffer = start;
            this.engineRunBuffer = run;
            this.airBrakeBuffer = brake;
            this.rawBuffers = null; // Free raw bytes — no longer needed
        } else {
            // Fallback: fetch + decode in one step if preload missed
            const fetchAndDecode = async (url: string): Promise<AudioBuffer | null> => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) return null;
                    return await this.ctx!.decodeAudioData(await res.arrayBuffer());
                } catch {
                    return null;
                }
            };
            const [swoosh09, swoosh36, swoosh85, start, run, brake] = await Promise.all([
                fetchAndDecode(swoosh09Url),
                fetchAndDecode(swoosh36Url),
                fetchAndDecode(swoosh85Url),
                fetchAndDecode(engineStartUrl),
                fetchAndDecode(engineRunUrl),
                fetchAndDecode(airBrakeUrl),
            ]);
            this.swoosh09Buffer = swoosh09;
            this.swoosh36Buffer = swoosh36;
            this.swoosh85Buffer = swoosh85;
            this.engineStartBuffer = start;
            this.engineRunBuffer = run;
            this.airBrakeBuffer = brake;
        }

        this.buffersLoaded = !!(
            this.swoosh09Buffer &&
            this.swoosh36Buffer &&
            this.swoosh85Buffer &&
            this.engineStartBuffer &&
            this.engineRunBuffer &&
            this.airBrakeBuffer
        );
        console.log('[TruckAudio] Buffers decoded and ready');
    }

    private firePendingIfValid(): void {
        const p = this.lastProgress;

        if (p < SECTION_START || p >= SECTION_END) {
            // Clear pending section triggers (but NOT swooshes, which are global)
            this.pendingAirBrake = false;
            this.pendingEngine = false;
            this.pendingIdle = false;
            this.pendingHorn = false;
            return;
        }

        if (this.pendingAirBrake && p >= TRIGGER_AIR_BRAKE) {
            this.playAirBrake();
            this.airBrakeFired = true;
        }

        if (this.pendingEngine && p >= TRIGGER_ENGINE_START) {
            this.playEngineStart();
            this.engineStartFired = true;
        }

        if (this.pendingIdle && p >= TRIGGER_ENGINE_IDLE) {
            this.playEngineIdle();
            this.engineIdleFired = true;
        }

        if (this.pendingHorn && p >= TRIGGER_HORN) {
            this.playHorn();
            this.hornFired = true;
        }

        this.clearPending();
    }

    private clearPending(): void {
        this.pendingAirBrake = false;
        this.pendingEngine = false;
        this.pendingIdle = false;
        this.pendingHorn = false;
    }

    update(progress: number): void {
        if (!this.initialized) return;

        // GLOBAL ACTIONS (Not bound by S4-1b section bounds)
        // Swoosh plays on crossing TRIGGER_SWOOSH_09 in EITHER direction
        const crossed09Down =
            this.lastProgress < TRIGGER_SWOOSH_09 && progress >= TRIGGER_SWOOSH_09;
        const crossed09Up = this.lastProgress > TRIGGER_SWOOSH_09 && progress <= TRIGGER_SWOOSH_09;
        if (crossed09Down || crossed09Up) {
            this.triggerSwoosh09();
        }

        // Swoosh plays on crossing TRIGGER_SWOOSH_36 in EITHER direction
        const crossed36Down =
            this.lastProgress < TRIGGER_SWOOSH_36 && progress >= TRIGGER_SWOOSH_36;
        const crossed36Up = this.lastProgress > TRIGGER_SWOOSH_36 && progress <= TRIGGER_SWOOSH_36;
        if (crossed36Down || crossed36Up) {
            this.triggerSwoosh36();
        }

        // Swoosh plays on crossing TRIGGER_SWOOSH_85 in EITHER direction
        const crossed85Down =
            this.lastProgress < TRIGGER_SWOOSH_85 && progress >= TRIGGER_SWOOSH_85;
        const crossed85Up = this.lastProgress > TRIGGER_SWOOSH_85 && progress <= TRIGGER_SWOOSH_85;
        if (crossed85Down || crossed85Up) {
            this.triggerSwoosh85();
        }

        // -----------------------------------------------------------------
        // SECTION-BOUND ACTIONS (S4-1b Truck Only)
        // -----------------------------------------------------------------
        const inSection = progress >= SECTION_START && progress < SECTION_END;
        const wasInSection = this.lastProgress >= SECTION_START && this.lastProgress < SECTION_END;

        if (wasInSection && !inSection) {
            this.stopAll();
            this.resetTriggers();
            this.lastProgress = progress;
            return;
        }

        if (!inSection) {
            this.lastProgress = progress;
            return;
        }

        if (progress < this.lastProgress) {
            this.stopAll();
            this.lastProgress = progress;
            return;
        }

        if (progress >= TRIGGER_AIR_BRAKE && !this.airBrakeFired) {
            if (this.triggerAirBrake()) {
                this.airBrakeFired = true;
            }
        }

        if (progress >= TRIGGER_ENGINE_START && !this.engineStartFired) {
            if (this.triggerEngineStart()) {
                this.engineStartFired = true;
            }
        }

        if (progress >= TRIGGER_ENGINE_IDLE && !this.engineIdleFired) {
            if (this.triggerEngineIdle()) {
                this.engineIdleFired = true;
            }
        }

        if (progress >= TRIGGER_HORN && !this.hornFired) {
            if (this.triggerHorn()) {
                this.hornFired = true;
            }
        }

        if (progress >= FADE_OUT_START && progress < FADE_OUT_END) {
            this.applyFadeOut(progress);
        } else if (progress < FADE_OUT_START && this.masterGain && this.ctx && !this.muted) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.setTargetAtTime(this.targetVolume, now, 0.05);
        }

        if (progress < TRIGGER_AIR_BRAKE - 0.005) this.airBrakeFired = false;
        if (progress < TRIGGER_ENGINE_START - 0.005) this.engineStartFired = false;
        if (progress < TRIGGER_ENGINE_IDLE - 0.005) {
            this.engineIdleFired = false;
            if (this.engineRunning) this.stopEngine();
        }
        if (progress < TRIGGER_HORN - 0.005) this.hornFired = false;

        this.lastProgress = progress;
    }

    private applyFadeOut(progress: number): void {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const fadeRange = FADE_OUT_END - FADE_OUT_START;
        const fadeProgress = (progress - FADE_OUT_START) / fadeRange;
        const fadeFactor = Math.max(0, 1 - fadeProgress);
        const targetVol = this.targetVolume * fadeFactor;
        const now = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(targetVol, now, 0.05);
    }

    triggerSwoosh09(): boolean {
        if (!this.unlocked || !this.buffersLoaded) return false;
        this.playSwoosh09();
        return true;
    }

    triggerSwoosh36(): boolean {
        if (!this.unlocked || !this.buffersLoaded) return false;
        this.playSwoosh36();
        return true;
    }

    triggerSwoosh85(): boolean {
        if (!this.unlocked || !this.buffersLoaded) return false;
        this.playSwoosh85();
        return true;
    }

    triggerAirBrake(): boolean {
        if (!this.unlocked || !this.buffersLoaded) {
            this.pendingAirBrake = true;
            return true;
        }
        this.playAirBrake();
        return true;
    }

    triggerEngineStart(): boolean {
        if (!this.unlocked || !this.buffersLoaded) {
            this.pendingEngine = true;
            return true;
        }
        this.playEngineStart();
        return true;
    }

    triggerEngineIdle(): boolean {
        if (!this.unlocked || !this.buffersLoaded) {
            this.pendingIdle = true;
            return true;
        }
        this.playEngineIdle();
        return true;
    }

    triggerHorn(): boolean {
        if (!this.unlocked || !this.buffersLoaded) {
            this.pendingHorn = true;
            return true;
        }
        this.playHorn();
        return true;
    }

    private playSwoosh09(): void {
        if (!this.ctx || !this.swoosh09Buffer || !this.swooshGain || this.muted) return;
        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = this.swoosh09Buffer;
        source.connect(this.swooshGain);
        source.start(now);
        console.log('[TruckAudio] Swoosh 09% triggered');
    }

    private playSwoosh36(): void {
        if (!this.ctx || !this.swoosh36Buffer || !this.swooshGain || this.muted) return;
        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = this.swoosh36Buffer;

        // Connect directly to swooshGain (bypasses section fade-out)
        source.connect(this.swooshGain);
        source.start(now);
        console.log('[TruckAudio] Swoosh 36% triggered');
    }

    private playSwoosh85(): void {
        if (!this.ctx || !this.swoosh85Buffer || !this.swooshGain || this.muted) return;
        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = this.swoosh85Buffer;

        source.connect(this.swooshGain);
        source.start(now);
        console.log('[TruckAudio] Swoosh 85% triggered');
    }

    private playAirBrake(): void {
        if (!this.ctx || !this.airBrakeBuffer || !this.masterGain || this.muted) return;
        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = this.airBrakeBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + this.airBrakeBuffer.duration);
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start(now);
    }

    private playEngineStart(): void {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const now = this.ctx.currentTime;
        if (this.engineStartBuffer) {
            const source = this.ctx.createBufferSource();
            source.buffer = this.engineStartBuffer;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(1, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + this.engineStartBuffer.duration);
            source.connect(gain);
            gain.connect(this.masterGain);
            source.start(now);
        }
    }

    private playEngineIdle(): void {
        if (!this.ctx || !this.masterGain || this.muted) return;
        if (this.engineRunning) return;
        this.engineRunning = true;
        const now = this.ctx.currentTime;

        if (this.engineRunBuffer) {
            this.engineRunGain = this.ctx.createGain();
            this.engineRunGain.gain.setValueAtTime(0, now);
            this.engineRunGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
            this.engineRunGain.connect(this.masterGain);

            this.engineRunSource = this.ctx.createBufferSource();
            this.engineRunSource.buffer = this.engineRunBuffer;
            this.engineRunSource.loop = true;
            this.engineRunSource.connect(this.engineRunGain);
            this.engineRunSource.start(now);
        }
    }

    private stopEngine(): void {
        if (!this.engineRunning) return;
        if (this.engineRunSource) {
            try {
                this.engineRunSource.stop();
            } catch {
                /* ignore */
            }
            this.engineRunSource = null;
        }
        if (this.engineRunGain && this.ctx) {
            this.engineRunGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        this.engineRunGain = null;
        this.engineRunning = false;
    }

    private playHorn(): void {
        if (!this.ctx || !this.masterGain || this.muted) return;

        this.playAirBrake();
        const now = this.ctx.currentTime;

        this.hornGain = this.ctx.createGain();
        this.hornGain.gain.setValueAtTime(0, now);
        this.hornGain.connect(this.masterGain);

        this.hornOsc1 = this.ctx.createOscillator();
        this.hornOsc1.type = 'sawtooth';
        this.hornOsc1.frequency.value = 185;
        this.hornOsc1.connect(this.hornGain);
        this.hornOsc1.start(now);

        this.hornOsc2 = this.ctx.createOscillator();
        this.hornOsc2.type = 'sawtooth';
        this.hornOsc2.frequency.value = 233;
        this.hornOsc2.connect(this.hornGain);
        this.hornOsc2.start(now);

        this.hornGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        this.hornGain.gain.setValueAtTime(0.15, now + 1);
        this.hornGain.gain.linearRampToValueAtTime(0, now + 1.1);

        this.hornGain.gain.setValueAtTime(0, now + 1.4);
        this.hornGain.gain.linearRampToValueAtTime(0.15, now + 1.5);
        this.hornGain.gain.setValueAtTime(0.15, now + 1.9);
        this.hornGain.gain.linearRampToValueAtTime(0, now + 2);

        this.hornOsc1.stop(now + 2.1);
        this.hornOsc2.stop(now + 2.1);
    }

    stopAll(): void {
        this.stopEngine();
        if (this.hornOsc1) {
            try {
                this.hornOsc1.stop();
            } catch {
                /* ignore */
            }
            this.hornOsc1 = null;
        }
        if (this.hornOsc2) {
            try {
                this.hornOsc2.stop();
            } catch {
                /* ignore */
            }
            this.hornOsc2 = null;
        }
        if (this.hornGain && this.ctx) {
            this.hornGain.gain.setValueAtTime(0, this.ctx.currentTime);
            this.hornGain = null;
        }
    }

    private resetTriggers(): void {
        this.airBrakeFired = false;
        this.engineStartFired = false;
        this.engineIdleFired = false;
        this.hornFired = false;
        this.clearPending();
    }

    setMuted(muted: boolean): void {
        this.muted = muted;
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const targetVol = muted ? 0 : this.targetVolume;
        this.masterGain.gain.linearRampToValueAtTime(targetVol, now + 0.3);
    }

    getAudioContext(): AudioContext | null {
        return this.ctx;
    }
    getMasterGain(): GainNode | null {
        return this.masterGain;
    }
    isUnlocked(): boolean {
        return this.unlocked && this.buffersLoaded;
    }

    dispose(): void {
        this.stopAll();
        this.resetTriggers();
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
        this.initialized = false;
        this.unlocked = false;
        this.buffersLoaded = false;
    }
}
