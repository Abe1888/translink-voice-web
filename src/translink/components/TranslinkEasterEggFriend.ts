import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { TranslinkVoiceManager, VoiceState } from './TranslinkVoiceManager';
import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';
import { TranslinkAIBrain } from './TranslinkAIBrain';

gsap.registerPlugin(MotionPathPlugin);

type BusinessExpression = 'neutral' | 'confirming' | 'empathetic' | 'thinking' | 'error';

/* ── Procedural animation CSS injected once ─────────────────────────────── */
const PROC_CSS = `
#tl-companion {
  --robot-color: #e0e0e0;
  --accent-glow: var(--brand-crimson);
  --brand-cyan: #00d2ff;
  --brand-crimson: #c0202f;
  
  /* 3D context perspective */
  perspective: 800px;
  
  /* Uniform scaling origin anchors */
  transform-origin: right bottom;
  transition: transform 0.3s ease;
}

html[dir="rtl"] #tl-companion {
  transform-origin: left bottom;
}

@media (max-width: 1024px) {
  #tl-companion {
    transform: scale(0.75);
  }
}

@media (max-width: 640px) {
  #tl-companion {
    transform: scale(0.6);
  }
}

#tl-companion .robot-creature {
  position: relative;
  width: 90px;
  height: 110px;
  z-index: 5;
  pointer-events: auto;
  cursor: pointer;
  transform-style: preserve-3d;
  transform-origin: center bottom;
  will-change: transform;
  transition: opacity 0.4s ease;
}

#tl-companion .robot-floating-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
}

/* --- STATE IDLE FLOATING ANIMATION --- */
#tl-companion.state-idle .robot-floating-wrapper {
  animation: robotFloat 3.5s ease-in-out infinite;
}

@keyframes robotFloat {
  0%, 100% {
    transform: translateY(0) rotate(-1deg);
  }
  50% {
    transform: translateY(-10px) rotate(1deg);
  }
}

/* --- ROBOT HEAD --- */
#tl-companion .robot-head {
  width: 52px;
  height: 44px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 45%), 
              radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.4) 0%, transparent 60%), 
              var(--robot-color);
  border-radius: 50% 50% 45% 45%;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  box-shadow: inset -5px -8px 15px rgba(0, 0, 0, 0.4), 
              inset 3px 3px 10px rgba(255, 255, 255, 0.4), 
              0 10px 20px rgba(0, 0, 0, 0.5);
  transform-origin: bottom center;
  transform-style: preserve-3d;
  transform: translateZ(5px);
  will-change: transform;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

#tl-companion.state-idle .robot-head {
  animation: robotLookAround 4s ease-in-out infinite;
}

@keyframes robotLookAround {
  0%, 40%, 100% {
    transform: rotateY(0deg) rotateZ(0deg) translateZ(5px);
  }
  15% {
    transform: rotateY(-10deg) rotateZ(-1deg) translateZ(5px);
  }
  25% {
    transform: rotateY(10deg) rotateZ(1deg) translateZ(5px);
  }
}

/* --- VISOR & EYES --- */
#tl-companion .robot-visor {
  width: 38px;
  height: 16px;
  background: #0d0d11;
  border-radius: 12px;
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%) translateZ(8px) translate(var(--visor-offset-x, 0px), var(--visor-offset-y, 0px));
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 210, 255, 0.3);
  will-change: transform;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

#tl-companion .robot-visor::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent);
  pointer-events: none;
}

#tl-companion .robot-eye {
  width: 8px;
  height: 5px;
  background: var(--brand-cyan);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--brand-cyan);
  transform: translate(var(--eye-offset-x, 0px), var(--eye-offset-y, 0px));
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* --- HEADSET & EARCUPS --- */
#tl-companion .robot-headset {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) translateZ(2px);
  width: 60px;
  height: 38px;
  border-top: 4px solid #1c1c24;
  border-radius: 50% 50% 0 0;
  z-index: 3;
  transform-style: preserve-3d;
}

#tl-companion .earcup {
  width: 12px;
  height: 18px;
  background: linear-gradient(135deg, #2a2a35 0%, #1c1c24 100%);
  border-radius: 5px;
  position: absolute;
  top: 16px;
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.1), 0 3px 8px rgba(0, 0, 0, 0.5);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

#tl-companion .earcup.l {
  left: -7px;
}

#tl-companion .earcup.r {
  right: -7px;
}

#tl-companion .robot-mic {
  width: 16px;
  height: 3px;
  background: #1c1c24;
  position: absolute;
  bottom: -2px;
  right: -3px;
  transform: rotate(35deg);
  transform-origin: left center;
}

#tl-companion .robot-mic::after {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--brand-cyan);
  border-radius: 50%;
  position: absolute;
  right: -3px;
  top: -1.5px;
  box-shadow: 0 0 5px var(--brand-cyan), inset 1px 1px 2px rgba(255, 255, 255, 0.5);
}

#tl-companion .robot-antenna {
  width: 2px;
  height: 14px;
  background: rgba(255, 255, 255, 0.4);
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%) translateZ(2px);
}

#tl-companion .robot-antenna::after {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--brand-cyan);
  border-radius: 50%;
  position: absolute;
  top: -4px;
  left: -2px;
  box-shadow: 0 0 10px var(--brand-cyan);
}

/* --- ROBOT BODY --- */
#tl-companion .robot-body {
  width: 44px;
  height: 65px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 45%), 
              radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.4) 0%, transparent 60%), 
              var(--robot-color);
  border-radius: 35% 35% 75% 75%;
  margin: -10px auto 0;
  position: relative;
  z-index: 1;
  box-shadow: inset -6px -8px 18px rgba(0, 0, 0, 0.4), 
              inset 3px 3px 12px rgba(255, 255, 255, 0.3), 
              0 12px 25px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  padding-top: 16px;
  transform-origin: top center;
  transform-style: preserve-3d;
  transform: translateZ(0);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

#tl-companion.state-idle .robot-body {
  animation: robotBodyFollow 4s ease-in-out infinite;
}

@keyframes robotBodyFollow {
  0%, 40%, 100% {
    transform: rotateY(0deg) rotateZ(0deg) translateY(0) translateZ(0);
  }
  15% {
    transform: rotateY(-6deg) rotateZ(-1deg) translateY(0.5px) translateZ(0);
  }
  25% {
    transform: rotateY(6deg) rotateZ(1deg) translateY(0.5px) translateZ(0);
  }
}

/* --- ROBOT EMBLEM --- */
#tl-companion .robot-emblem {
  width: 24px;
  height: 24px;
  background: var(--accent-glow);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 12px var(--accent-glow);
  overflow: hidden;
  transform: translateZ(3px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

#tl-companion .robot-emblem img,
#tl-companion .robot-emblem svg {
  width: 13px;
  height: 13px;
  object-fit: contain;
}

/* --- ROBOT HANDS / ARMS --- */
#tl-companion .robot-hand {
  width: 10px;
  height: 48px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, transparent 60%), 
              var(--robot-color);
  position: absolute;
  top: -3px;
  z-index: 0;
  box-shadow: inset -3px -3px 8px rgba(0, 0, 0, 0.4), 
              0 5px 10px rgba(0, 0, 0, 0.4);
  transform: translateZ(-8px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

#tl-companion .robot-hand.l {
  left: -5px;
  transform: rotate(16deg) translateZ(-8px);
  transform-origin: top center;
  border-radius: 100% 25% 5% 85%;
}

#tl-companion .robot-hand.r {
  right: -5px;
  transform: rotate(-16deg) translateZ(-8px);
  transform-origin: top center;
  border-radius: 25% 100% 85% 5%;
}

#tl-companion.state-idle .robot-hand.l {
  animation: robotHoverL 3s ease-in-out infinite alternate;
}

#tl-companion.state-idle .robot-hand.r {
  animation: robotHoverR 3s ease-in-out infinite alternate;
}

@keyframes robotHoverL {
  0% {
    transform: rotate(18deg) translateY(0) translateZ(-8px);
  }
  100% {
    transform: rotate(10deg) translateY(6px) translateX(1px) translateZ(-8px);
  }
}

@keyframes robotHoverR {
  0% {
    transform: rotate(-18deg) translateY(0) translateZ(-8px);
  }
  100% {
    transform: rotate(-10deg) translateY(6px) translateX(-1px) translateZ(-8px);
  }
}

/* ========================================== */
/*   BEHAVIOR STATE CSS MODIFIERS             */
/* ========================================== */

/* --- FLYING STATE --- */
#tl-companion.state-flying .robot-hand.l {
  transform: rotate(45deg) translateZ(-8px);
  height: 35px;
}

#tl-companion.state-flying .robot-hand.r {
  transform: rotate(-45deg) translateZ(-8px);
  height: 35px;
}

#tl-companion.state-flying .robot-floating-wrapper {
  animation: robotThruster 1.5s ease-in-out infinite alternate !important;
}

@keyframes robotThruster {
  0% {
    transform: translateY(0) rotate(-1.5deg);
  }
  100% {
    transform: translateY(-6px) rotate(1.5deg);
  }
}

/* --- GRABBING STATE --- */
#tl-companion.state-grabbing .robot-hand.l {
  transform: rotate(90deg) translateY(-15px) translateZ(-8px);
  height: 50px;
}

#tl-companion.state-grabbing .robot-hand.r {
  transform: rotate(-90deg) translateY(-15px) translateZ(-8px);
  height: 50px;
}

/* --- ERROR / CLARIFICATION STATE --- */
#tl-companion.state-alert .robot-head {
  background: linear-gradient(135deg, #d8dde5, #f4f7fa) !important;
  animation: attentivePause 1.8s infinite ease-in-out;
}

#tl-companion.state-alert .robot-eye {
  background: #ffb84d;
  box-shadow: 0 0 10px rgba(255, 184, 77, 0.65);
  transform: scaleY(0.72);
}

@keyframes attentivePause {
  0%, 100% { transform: rotateY(0) translateZ(5px); }
  50% { transform: rotateY(4deg) translateZ(5px); }
}

/* --- GUIDING STATE --- */
#tl-companion.state-guiding .robot-hand.r {
  transform: rotate(-90deg) translateY(-2px) translateZ(-8px);
  height: 50px;
}

html[dir="rtl"] #tl-companion.state-guiding .robot-hand.r {
  transform: rotate(-90deg) translateY(-2px) translateZ(-8px) !important;
  height: 50px !important;
}

html[dir="rtl"] #tl-companion.state-guiding .robot-hand.l {
  transform: rotate(16deg) translateZ(-8px) !important;
  height: 48px !important;
}

/* --- THINKING STATE --- */
#tl-companion.state-thinking .robot-visor {
  display: block;
  position: relative;
}

#tl-companion.state-thinking .robot-eye {
  position: absolute;
  top: 5px;
  animation: cylonScan 1.5s infinite alternate ease-in-out;
}

#tl-companion.state-thinking .robot-eye:nth-child(2) {
  display: none;
}

@keyframes cylonScan {
  0% { left: 5px; }
  100% { left: 25px; }
}

/* --- CONNECTING / THINKING STATE --- */
#tl-companion.state-thinking .robot-emblem {
  animation: emblemBreathe 1s infinite ease-in-out alternate;
}

@keyframes emblemBreathe {
  0% {
    box-shadow: 0 0 5px var(--brand-crimson);
    filter: drop-shadow(0 0 2px var(--brand-crimson));
  }
  100% {
    box-shadow: 0 0 25px var(--brand-crimson), 0 0 35px var(--brand-crimson);
    filter: drop-shadow(0 0 10px var(--brand-crimson));
  }
}

/* --- LISTENING STATE --- */
#tl-companion.state-listening .robot-emblem {
  box-shadow: 0 0 14px var(--brand-crimson), 0 0 24px rgba(192, 32, 47, 0.45);
  animation: emblemPulse 1.8s infinite ease-in-out alternate;
}

#tl-companion.state-listening .earcup {
  background: var(--brand-cyan) !important;
  box-shadow: 0 0 15px var(--brand-cyan) !important;
}

#tl-companion.state-listening .robot-eye {
  background: var(--brand-cyan) !important;
  box-shadow: 0 0 10px var(--brand-cyan) !important;
}

@keyframes emblemPulse {
  0% { box-shadow: 0 0 8px rgba(192, 32, 47, 0.75); }
  100% { box-shadow: 0 0 22px rgba(192, 32, 47, 0.85), 0 0 34px rgba(0, 210, 255, 0.16); }
}

/* --- SPEAKING STATE --- */
#tl-companion.state-speaking .robot-emblem {
  animation: speakPulse 0.38s infinite alternate !important;
}

@keyframes speakPulse {
  0% {
    transform: scale(1) translateZ(3px);
    box-shadow: 0 0 8px var(--brand-crimson);
  }
  100% {
    transform: scale(1.08) translateZ(3px);
    box-shadow: 0 0 20px var(--brand-crimson), 0 0 28px rgba(192, 32, 47, 0.5);
  }
}

/* --- EMBLEM PULSE GUIDE: Attention-grabbing glow to guide visitor to click the red logo --- */
#tl-companion .robot-emblem.emblem-pulse-guide {
  animation: emblemGuideGlow 1.2s ease-in-out infinite !important;
  cursor: pointer;
  z-index: 10;
}

@keyframes emblemGuideGlow {
  0%, 100% {
    transform: scale(1) translateZ(3px);
    box-shadow: 0 0 12px var(--brand-crimson), 0 0 24px rgba(255, 0, 85, 0.4);
  }
  50% {
    transform: scale(1.16) translateZ(5px);
    box-shadow: 0 0 22px var(--brand-crimson), 0 0 42px rgba(255, 0, 85, 0.42), 0 0 54px rgba(0, 210, 255, 0.16);
  }
}

@keyframes professionalAttention {
  0%, 100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
  50% {
    transform: translateY(-4px) rotate(0.75deg) scale(1.01);
  }
}

/* ========================================== */
/*   EMOTION MATRIX OVERRIDES                 */
/* ========================================== */
#tl-companion.exp-error .robot-eye {
  transform: scaleY(0.72);
  background: #ffb84d;
  box-shadow: 0 0 10px rgba(255, 184, 77, 0.65);
}

#tl-companion.exp-confirming .robot-eye {
  border-radius: 8px;
  transform: scale(1.05);
  background: var(--brand-cyan);
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.7);
}

#tl-companion.exp-empathetic .robot-eye {
  transform: scaleY(0.86);
  background: #9be7ff;
  box-shadow: 0 0 10px rgba(155, 231, 255, 0.6);
}

#tl-companion.exp-thinking .robot-eye {
  transform: scaleY(0.78);
  background: #ffffff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.55);
}

/* --- CALM CLICK ACKNOWLEDGEMENT --- */
#tl-companion.popping {
  animation: tl-pop 0.45s ease-out;
}

@keyframes tl-pop {
  0% { transform: scale(1); }
  45% { transform: scale(1.04) translateY(-3px); }
  100% { transform: scale(1); }
}


`;

enum State {
    IDLE,
    FLYING,
    PRESENTING,
    RETURNING,
}

export class TranslinkEasterEggFriend {
    private static instance: TranslinkEasterEggFriend | null = null;
    static getInstance(): TranslinkEasterEggFriend {
        if (!TranslinkEasterEggFriend.instance)
            TranslinkEasterEggFriend.instance = new TranslinkEasterEggFriend();
        return TranslinkEasterEggFriend.instance;
    }
    static reset(): void {
        TranslinkEasterEggFriend.instance = null;
    }

    /* DOM */
    private shell: HTMLElement | null = null;
    private mover: HTMLElement | null = null;
    private tiltWrap: HTMLElement | null = null;
    private floater: HTMLElement | null = null;
    private creatureEl: HTMLElement | null = null;
    private headEl: HTMLElement | null = null;
    private buttonSlot: HTMLElement | null = null;
    private styleTag: HTMLStyleElement | null = null;

    /* Animation */
    private floatTl: gsap.core.Timeline | null = null;
    private flightTl: gsap.core.Timeline | null = null;
    private buttonFloatTl: gsap.core.Timeline | null = null;
    private state = State.IDLE;
    private prevX = 0;
    private prevY = 0;
    private isHovered = false;
    private hoverFloatTl: gsap.core.Timeline | null = null;

    /* Button tracking */
    private carriedBtn: HTMLElement | null = null;
    private btnParent: HTMLElement | null = null;
    private btnSibling: Node | null = null;

    /* Interactive variables */
    private audioCtx: AudioContext | null = null;
    private isAcknowledgingClick = false;
    private isHoldingNotepad = false;
    private scrollTimer: ReturnType<typeof setTimeout> | null = null;
    private scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
    private wanderTimer: ReturnType<typeof setTimeout> | null = null;
    private isWandering = false;
    private handleScroll: (() => void) | null = null;
    private facing = 1;
    private currentFacing = 1;
    private activeExpression: BusinessExpression = 'neutral';

    /* Voice link variables */
    private voiceManager: TranslinkVoiceManager | null = null;
    private mouthEl: HTMLElement | null = null;
    private lipSyncRafId: number | null = null;
    private brain: TranslinkAIBrain | null = null;
    private welcomeCompleted = false;
    private welcomeGuideDelivered = false;
    private emblemEl: HTMLElement | null = null;
    // Tracks whether the robot has spoken at least once in the current voice session.
    // Welcome-complete logic must only fire AFTER the robot has actually spoken,
    // not on the first 'listening' state that fires when the WebSocket opens.
    private _robotHasSpoken = false;
    private _isAutomatedSession = false;
    private _pendingAutomatedPrompt: string | null = null;
    private _pendingAutomatedExpression: BusinessExpression = 'neutral';
    private _pendingChatGreeting = false;

    private constructor() {}

    mount(parent: HTMLElement = document.body): void {
        if (this.shell) return;

        if (!document.getElementById('tl-companion-css')) {
            this.styleTag = document.createElement('style');
            this.styleTag.id = 'tl-companion-css';
            this.styleTag.textContent = PROC_CSS;
            document.head.appendChild(this.styleTag);
        }

        const isAr = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        this.shell = document.createElement('div');
        this.shell.id = 'tl-companion';
        this.shell.className = 'state-idle';
        Object.assign(this.shell.style, {
            position: 'fixed',
            right: isAr ? 'auto' : '32px',
            left: isAr ? '32px' : 'auto',
            bottom: '32px',
            zIndex: '9999',
            pointerEvents: 'none',
            overflow: 'visible',
        });

        this.mover = document.createElement('div');
        Object.assign(this.mover.style, { willChange: 'transform' });

        this.tiltWrap = document.createElement('div');
        Object.assign(this.tiltWrap.style, {
            position: 'relative',
            transformOrigin: 'bottom center',
            willChange: 'transform',
        });

        this.floater = document.createElement('div');
        Object.assign(this.floater.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            willChange: 'transform',
        });

        // Absolutely positioned next to the pointing hand (right arm in LTR, left arm in RTL)
        this.buttonSlot = document.createElement('div');
        Object.assign(this.buttonSlot.style, {
            position: 'absolute',
            left: isAr ? '-135px' : '125px', // Mirrored next to pointing arm
            top: '16px', // Arm/Shoulder level
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'auto',
            opacity: '0',
            transform: isAr
                ? 'scale(0) translate3d(130px, 50px, -50px) rotate(30deg)' // Tucked behind the assistant initially (mirrored)
                : 'scale(0) translate3d(-130px, 50px, -50px) rotate(-30deg)',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
            zIndex: '5',
            willChange: 'transform, opacity',
        });

        this.creatureEl = document.createElement('div');
        this.creatureEl.className = 'robot-creature';
        Object.assign(this.creatureEl.style, {
            position: 'relative',
            bottom: 'auto',
            left: 'auto',
            right: 'auto',
            top: 'auto',
            transform: 'none',
            display: 'block',
            cursor: 'pointer',
            pointerEvents: 'auto',
        });

        this.creatureEl.innerHTML = `
            <div class="robot-floating-wrapper">
                <div class="robot-head">
                    <div class="robot-headset">
                        <div class="earcup l"></div>
                        <div class="earcup r">
                            <div class="robot-mic"></div>
                        </div>
                    </div>
                    <div class="robot-antenna"></div>
                    <div class="robot-visor">
                        <div class="robot-eye"></div>
                        <div class="robot-eye"></div>
                    </div>
                    <!-- Procedural mouth for lip-sync -->
                    <div class="robot-mouth" style="
                        position: absolute;
                        bottom: 6px;
                        left: 50%;
                        transform: translateX(-50%) translateZ(8px);
                        width: 14px;
                        height: 2px;
                        background: var(--brand-cyan);
                        border-radius: 2px;
                        box-shadow: 0 0 8px var(--brand-cyan);
                        opacity: 0;
                        transition: opacity 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
                    "></div>
                </div>
                <div class="robot-body">
                    <div class="robot-hand l"></div>
                    <div class="robot-hand r"></div>
                    <div class="robot-emblem">
                        <img src="./textures/ui/logo.png" alt="TL Logo" onerror="this.style.display='none'; if(this.nextElementSibling) (this.nextElementSibling as HTMLElement).style.display='block';">
                        <svg viewBox="0 0 24 24" style="display:none; fill:#000; width:13px; height:13px;">
                            <path d="M4,2H20V6H14V22H10V6H4V2Z" />
                        </svg>
                    </div>
                </div>
            </div>
        `;

        this.headEl = this.creatureEl.querySelector('.robot-head') as HTMLElement;
        if (this.headEl) {
            Object.assign(this.headEl.style, {
                transformOrigin: 'bottom center',
                willChange: 'transform',
            });
        }

        this.mouthEl = this.creatureEl.querySelector('.robot-mouth') as HTMLElement;
        this.emblemEl = this.creatureEl.querySelector('.robot-emblem') as HTMLElement;

        // Emblem (red Translink logo) click triggers voice session toggle
        if (this.emblemEl) {
            this.emblemEl.style.cursor = 'pointer';
            this.emblemEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Companion] Emblem clicked — toggling voice session');
                this._toggleVoiceSession();
                // Stop the attention pulse once clicked
                if (this.emblemEl) {
                    this.emblemEl.classList.remove('emblem-pulse-guide');
                }
            });
        }

        const bodyEl = this.creatureEl.querySelector('.robot-body') as HTMLElement | null;
        if (bodyEl) {
            bodyEl.style.cursor = 'pointer';
            bodyEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Companion] Robot body clicked - toggling voice session');
                this._toggleVoiceSession();
            });
        }

        // Handle interactive hover pause & cursor eye contact behaviors
        this.creatureEl.addEventListener('mouseenter', () => {
            this._handleHoverStart();
        });
        this.creatureEl.addEventListener('mouseleave', () => {
            this._handleHoverEnd();
        });

        // Double-click triggers Gemini voice link
        this.creatureEl.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._toggleVoiceSession();
        });

        // Initialize client-side AI Cognition & Memory
        this.brain = new TranslinkAIBrain();
        this.brain.setDecisionCallback((promptText, emotion) => {
            const voiceManager = this._ensureVoiceManager();
            if (voiceManager.isConnected()) {
                voiceManager.sendText(promptText);
                this.setExpression(emotion);
            } else {
                console.log('[Companion] Automatically connecting voice link due to brain decision:', emotion);
                this._autoConnectAndPrompt(promptText, emotion);
            }
        });

        this.floater.appendChild(this.creatureEl);
        this.tiltWrap.appendChild(this.floater);
        this.tiltWrap.appendChild(this.buttonSlot); // Sibling of floater inside tiltWrap (decoupled float mechanics)
        this.mover.appendChild(this.tiltWrap);
        this.shell.appendChild(this.mover);
        parent.appendChild(this.shell);

        this._startIdleFloat();
        this._initMouseTracking();
        this._initClickInteraction();
        this._initScrollTracking();

        // Setup global listener to unlock browser audio restrictions upon first user click/scroll/keypress
        const resumeAudio = () => {
            if (this.voiceManager) {
                this.voiceManager.resumeContext();
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(() => {});
            }
            // Remove listeners immediately once audio is unlocked
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
            window.removeEventListener('scroll', resumeAudio);
            window.removeEventListener('translink:audio-unlock', resumeAudio);
        };
        window.addEventListener('click', resumeAudio, { once: true, passive: true });
        window.addEventListener('touchstart', resumeAudio, { once: true, passive: true });
        window.addEventListener('keydown', resumeAudio, { once: true, passive: true });
        window.addEventListener('scroll', resumeAudio, { once: true, passive: true });
        window.addEventListener('translink:audio-unlock', resumeAudio, { once: true, passive: true });

        // Rule-D: Automatically welcome every visitor on page load
        if (!this._hasWelcomedThisSession()) {
            this._playWelcomeSequence();
        } else {
            // Already welcomed this session. Keep the assistant calmly available without auto-connecting.
            this.welcomeCompleted = true;
            this.welcomeGuideDelivered = true;
            this.state = State.IDLE;
            this._updateStateClasses('idle', 'neutral');
            this._startIdleFloat();
        }
    }

    flyToButton(btn: HTMLElement): void {
        if (window.innerWidth <= 1024) return;
        if (!this.mover || !this.shell || !this.buttonSlot || !this.floater || !this.creatureEl)
            return;
        if (this.state === State.FLYING || this.state === State.PRESENTING) return;

        // Cancel wandering if active
        this.isWandering = false;
        if (this.wanderTimer) {
            clearTimeout(this.wanderTimer);
            this.wanderTimer = null;
        }

        this._killFlight();
        this.state = State.FLYING;
        this._updateStateClasses('flying', 'confirming');

        // Calculate flight targets before reparenting the button to prevent container collapse
        const shellRect = this.shell.getBoundingClientRect();
        const parentRect = btn.parentElement?.getBoundingClientRect();

        // Reparent button into robot slot (tucked behind the assistant initially)
        this.carriedBtn = btn;
        this.btnParent = btn.parentElement;
        this.btnSibling = btn.nextSibling;

        this.buttonSlot.innerHTML = '';
        this.buttonSlot.appendChild(btn);
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';

        const isAr = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        // Keep button completely hidden and tucked behind the assistant during flight
        gsap.set(this.buttonSlot, {
            opacity: 0,
            scale: 0,
            x: isAr ? 130 : -130,
            y: 50,
            z: -50,
            rotation: isAr ? 30 : -30,
        });
        const vw = window.innerWidth,
            vh = window.innerHeight,
            pad = 24;

        let targetX: number, targetY: number;
        if (parentRect) {
            targetX = parentRect.left + parentRect.width / 2 - shellRect.left - shellRect.width / 2;
            targetY = parentRect.top - shellRect.top - shellRect.height;
        } else {
            targetX = vw * 0.4 - shellRect.left;
            targetY = -(vh * 0.3);
        }

        // Clamp inside screen bounds
        const fL = shellRect.left + targetX,
            fT = shellRect.top + targetY;
        if (fL < pad) targetX += pad - fL;
        if (fT < pad) targetY += pad - fT;
        if (fL + shellRect.width > vw - pad) targetX -= fL + shellRect.width - (vw - pad);
        if (fT + shellRect.height > vh - pad) targetY -= fT + shellRect.height - (vh - pad);

        const startX = gsap.getProperty(this.mover, 'x') as number;
        const startY = gsap.getProperty(this.mover, 'y') as number;

        this.prevX = startX;
        this.prevY = startY;

        this._stopFloat();
        this._startCarryFloat();

        // Play flying synth sound effects
        this._playSynthBeep(300, 'sine', 0.5);
        setTimeout(() => this._playSynthBeep(400, 'sine', 0.5), 100);

        this.shell.style.pointerEvents = 'auto';

        this.flightTl = gsap.timeline({
            onUpdate: () => this._applyProceduralTilt(),
            onComplete: () => {
                this.state = State.PRESENTING;
                this._updateStateClasses('guiding', 'confirming');

                // Reset body speed tilts
                gsap.to(this.tiltWrap, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                if (this.headEl)
                    gsap.to(this.headEl, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                gsap.to(this.creatureEl, {
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    scaleX: isAr ? -1 : 1,
                    scaleY: 1,
                    duration: 0.4,
                    ease: 'power2.out',
                });
                this.facing = 1;
                this.currentFacing = 1;

                // Run cinematic spring-based button presentation choreography!
                this._animateButtonPresentation();
            },
        });

        // Cinematic spline curve using MotionPathPlugin
        const dx = targetX - startX;
        const dy = targetY - startY;
        this.flightTl.to(this.mover, {
            duration: 2.0,
            ease: 'power2.inOut',
            motionPath: {
                path: [
                    { x: startX + dx * 0.2, y: startY + dy * 0.5 - 150 }, // Curve high up
                    { x: startX + dx * 0.7, y: targetY - 100 },
                    { x: targetX, y: targetY },
                ],
                curviness: 1.5,
                type: 'soft',
            },
        });
    }

    private _animateButtonPresentation(): void {
        if (!this.creatureEl || !this.buttonSlot || !this.tiltWrap) return;

        const isAr = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        const activeHand = this.creatureEl.querySelector(
            isAr ? '.robot-hand.r' : '.robot-hand.r'
        ) as HTMLElement | null;
        const visor = this.creatureEl.querySelector('.robot-visor') as HTMLElement | null;
        const eyes = this.creatureEl.querySelectorAll('.robot-eye') as NodeListOf<HTMLElement>;

        // Clean any active float timelines
        if (this.buttonFloatTl) {
            this.buttonFloatTl.kill();
            this.buttonFloatTl = null;
        }

        const presentationTl = gsap.timeline();

        // 1. REACH PHASE (Reach behind back to grab button)
        presentationTl.to(this.tiltWrap, {
            rotationZ: isAr ? 8 : -8,
            rotationY: isAr ? 15 : -15,
            y: 5,
            duration: 0.35,
            ease: 'power1.out',
        });
        if (activeHand) {
            presentationTl.to(
                activeHand,
                {
                    rotation: isAr ? -30 : 30,
                    translateZ: -20,
                    duration: 0.35,
                    ease: 'power1.out',
                },
                0
            );
        }
        if (visor) {
            presentationTl.to(
                visor,
                {
                    '--visor-offset-x': isAr ? '6px' : '-6px',
                    '--visor-offset-y': '3px',
                    duration: 0.35,
                    ease: 'power1.out',
                },
                0
            );
        }
        eyes.forEach((eye) => {
            presentationTl.to(
                eye,
                {
                    '--eye-offset-x': isAr ? '2px' : '-2px',
                    '--eye-offset-y': '1px',
                    duration: 0.35,
                    ease: 'power1.out',
                },
                0
            );
        });

        // 2. PRESENT PHASE (Sweep hand out, spring-launch the button in cinematic arc)
        presentationTl.to(
            this.tiltWrap,
            {
                rotationZ: isAr ? -12 : 12,
                rotationY: isAr ? -20 : 20,
                y: -4,
                duration: 0.5,
                ease: 'back.out(1.5)',
            },
            '+=0.05'
        );

        if (activeHand) {
            presentationTl.to(
                activeHand,
                {
                    rotation: isAr ? 95 : -95,
                    translateY: -4,
                    translateZ: -10,
                    duration: 0.55,
                    ease: 'back.out(1.8)',
                },
                '<'
            );
        }

        if (visor) {
            presentationTl.to(
                visor,
                {
                    '--visor-offset-x': isAr ? '-7px' : '7px',
                    '--visor-offset-y': '-2px',
                    duration: 0.55,
                    ease: 'power2.out',
                },
                '<'
            );
        }
        eyes.forEach((eye) => {
            presentationTl.to(
                eye,
                {
                    '--eye-offset-x': isAr ? '-2px' : '2px',
                    '--eye-offset-y': '-1px',
                    duration: 0.55,
                    ease: 'power2.out',
                },
                '<'
            );
        });

        // Spring the button out from behind the back in an arc
        presentationTl.to(
            this.buttonSlot,
            {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                z: 0,
                rotation: 0,
                duration: 0.85,
                ease: 'elastic.out(1, 0.65)',
                onStart: () => {
                    // Play restrained presenting cue
                    this._playSynthBeep(600, 'sine', 0.15);
                    setTimeout(() => this._playSynthBeep(850, 'sine', 0.25), 80);
                },
            },
            '<+=0.1'
        );

        // 3. SETTLE PHASE (Gently return body to neutral alignment, keep arm guiding, transition eyes)
        presentationTl.to(this.tiltWrap, {
            rotationZ: 0,
            rotationY: 0,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
        });

        if (activeHand) {
            presentationTl.to(
                activeHand,
                {
                    rotation: isAr ? 90 : -90,
                    translateY: -2,
                    translateZ: -8,
                    duration: 0.6,
                    ease: 'power2.out',
                },
                '<'
            );
        }

        // Return eyes to center / cursor tracking
        if (visor) {
            presentationTl.to(
                visor,
                {
                    '--visor-offset-x': '0px',
                    '--visor-offset-y': '0px',
                    duration: 0.6,
                    ease: 'power2.out',
                },
                '<'
            );
        }
        eyes.forEach((eye) => {
            presentationTl.to(
                eye,
                {
                    '--eye-offset-x': '0px',
                    '--eye-offset-y': '0px',
                    duration: 0.6,
                    ease: 'power2.out',
                },
                '<'
            );
        });

        // Start decoupled secondary float animation for the button
        presentationTl.eventCallback('onComplete', () => {
            this.buttonFloatTl = gsap.timeline({ repeat: -1, yoyo: true });
            this.buttonFloatTl.to(this.buttonSlot, {
                y: -3,
                x: isAr ? -1 : 1,
                duration: 2.5,
                ease: 'sine.inOut',
            });

            // Rule-B: Once the button appears, return the hand/pointer to normal after 3 seconds
            setTimeout(() => {
                if (activeHand && this.state === State.PRESENTING) {
                    gsap.to(activeHand, {
                        rotation: 0,
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 0.8,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            if (activeHand && this.state === State.PRESENTING) {
                                gsap.set(activeHand, { clearProps: 'all' });
                                // Revert body state class back to idle to allow the arm CSS animations to rest naturally
                                this._updateStateClasses('idle', 'confirming');
                            }
                        }
                    });
                }
            }, 3000);
        });
    }

    returnHome(): void {
        if (!this.mover || !this.shell || !this.creatureEl || !this.buttonSlot) return;
        if (this.state === State.IDLE || this.state === State.RETURNING) return;

        // Ensure wandering is stopped
        this.isWandering = false;
        if (this.wanderTimer) {
            clearTimeout(this.wanderTimer);
            this.wanderTimer = null;
        }

        this._killFlight();
        this.state = State.RETURNING;
        this._updateStateClasses('flying', 'neutral');
        this.shell.style.pointerEvents = 'none';

        const isAr = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        const activeHand = this.creatureEl.querySelector(
            isAr ? '.robot-hand.l' : '.robot-hand.r'
        ) as HTMLElement | null;
        const visor = this.creatureEl.querySelector('.robot-visor') as HTMLElement | null;
        const eyes = this.creatureEl.querySelectorAll('.robot-eye') as NodeListOf<HTMLElement>;

        // Tuck-away animation timeline
        const tuckTl = gsap.timeline({
            onComplete: () => {
                this._releaseButton();
                this._flyBackHome();
            },
        });

        // 1. TUCK PHASE (Look at button, swing hand back, scale button to 0 behind back)
        tuckTl.to(this.tiltWrap, {
            rotationZ: isAr ? 4 : -4,
            rotationY: isAr ? 10 : -10,
            duration: 0.35,
            ease: 'power2.inOut',
        });
        if (activeHand) {
            tuckTl.to(
                activeHand,
                {
                    rotation: isAr ? 30 : -30,
                    translateZ: -10,
                    duration: 0.35,
                    ease: 'power2.inOut',
                },
                0
            );
        }
        if (visor) {
            tuckTl.to(
                visor,
                {
                    '--visor-offset-x': isAr ? '-4px' : '4px',
                    '--visor-offset-y': '1px',
                    duration: 0.35,
                    ease: 'power2.inOut',
                },
                0
            );
        }
        eyes.forEach((eye) => {
            tuckTl.to(
                eye,
                {
                    '--eye-offset-x': isAr ? '-1px' : '1px',
                    '--eye-offset-y': '0.5px',
                    duration: 0.35,
                    ease: 'power2.inOut',
                },
                0
            );
        });

        // Retract button behind back
        tuckTl.to(
            this.buttonSlot,
            {
                opacity: 0,
                scale: 0,
                x: isAr ? 130 : -130,
                y: 50,
                z: -50,
                rotation: isAr ? 30 : -30,
                duration: 0.4,
                ease: 'back.in(1.5)',
                onStart: () => {
                    // Play soft departure beeps
                    this._playSynthBeep(400, 'sine', 0.25);
                    setTimeout(() => this._playSynthBeep(300, 'sine', 0.35), 80);
                },
            },
            '<'
        );
    }

    private _flyBackHome(): void {
        if (!this.mover || !this.shell || !this.creatureEl) return;

        const isAr = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        const activeHand = this.creatureEl.querySelector(
            isAr ? '.robot-hand.l' : '.robot-hand.r'
        ) as HTMLElement | null;

        const startX = gsap.getProperty(this.mover, 'x') as number;
        const startY = gsap.getProperty(this.mover, 'y') as number;
        this.prevX = startX;
        this.prevY = startY;

        this._stopFloat();

        // Clear inline props on active hand so CSS state-flying class animates arms properly during flight
        if (activeHand) {
            gsap.set(activeHand, { clearProps: 'all' });
        }

        this.flightTl = gsap.timeline({
            onUpdate: () => this._applyProceduralTilt(),
            onComplete: () => {
                this.state = State.IDLE;
                this._updateStateClasses('idle', 'neutral');

                // Reset body speed tilts
                gsap.to(this.tiltWrap, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                if (this.headEl)
                    gsap.to(this.headEl, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                gsap.to(this.creatureEl, {
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 0.4,
                    ease: 'power2.out',
                });
                this.facing = 1;
                this.currentFacing = 1;

                // Fully reset visor and eye offset variables
                const visor = this.creatureEl?.querySelector('.robot-visor') as HTMLElement | null;
                const eyes = this.creatureEl?.querySelectorAll(
                    '.robot-eye'
                ) as NodeListOf<HTMLElement>;
                if (visor) {
                    visor.style.setProperty('--visor-offset-x', '0px');
                    visor.style.setProperty('--visor-offset-y', '0px');
                }
                eyes.forEach((eye) => {
                    eye.style.setProperty('--eye-offset-x', '0px');
                    eye.style.setProperty('--eye-offset-y', '0px');
                });

                this._startIdleFloat();
            },
        });

        // Return path spline
        this.flightTl.to(this.mover, {
            duration: 1.8,
            ease: 'power2.inOut',
            motionPath: {
                path: [
                    { x: startX * 0.5, y: startY - 100 },
                    { x: 0, y: 0 },
                ],
                curviness: 1.5,
                type: 'soft',
            },
        });
    }

    private _startIdleFloat(): void {
        this._stopFloat();
        if (!this.floater) return;
        this.floatTl = gsap.timeline({ repeat: -1, yoyo: true });
        if (window.innerWidth <= 1024) {
            // Minimal breathing movement on mobile and tablet
            this.floatTl.to(this.floater, { y: -2, duration: 4.0, ease: 'sine.inOut' });
            this.floatTl.to(this.floater, { rotation: 0.2, duration: 5.0, ease: 'sine.inOut' }, 0);
        } else {
            this.floatTl.to(this.floater, { y: -10, duration: 2.0, ease: 'sine.inOut' });
            this.floatTl.to(this.floater, { rotation: 1.5, duration: 2.5, ease: 'sine.inOut' }, 0);
        }
    }

    private _startCarryFloat(): void {
        this._stopFloat();
        if (!this.floater) return;
        this.floatTl = gsap.timeline({ repeat: -1, yoyo: true });
        this.floatTl.to(this.floater, { y: -14, duration: 1.3, ease: 'sine.inOut' });
        this.floatTl.to(this.floater, { rotation: 2.5, duration: 1.6, ease: 'sine.inOut' }, 0);
    }

    private _stopFloat(): void {
        if (this.floatTl) {
            this.floatTl.kill();
            this.floatTl = null;
        }
        if (this.floater) gsap.set(this.floater, { y: 0, rotation: 0 });
    }

    private _applyProceduralTilt(): void {
        if (this.isHovered) return;
        if (!this.mover || !this.tiltWrap || !this.creatureEl) return;
        const cx = gsap.getProperty(this.mover, 'x') as number;
        const cy = gsap.getProperty(this.mover, 'y') as number;
        const vx = cx - this.prevX;
        const vy = cy - this.prevY;

        // 1. Determine travel facing direction dynamically based on horizontal velocity vx
        if (Math.abs(vx) > 0.15) {
            this.facing = vx > 0 ? 1 : -1;
        }

        // 2. Smoothly interpolate current facing factor for 3D body spin
        this.currentFacing += (this.facing - this.currentFacing) * 0.12;

        // 3. Roll (lean) and Pitch into the flight direction
        const lean = vx * 1.5; // roll factor
        const pitch = vy * 0.8; // pitch factor

        // 4. Calculate 2.5D rotations and scale flips
        const rotX = pitch * (this.currentFacing > 0 ? 1 : -1);
        const rotY = -this.currentFacing * 15; // subtle 2.5D depth perspective tilt (max 15deg)
        const rotZ = lean * (this.currentFacing > 0 ? 1 : -1);

        // 5. Squash and stretch based on flying velocity (highly subtle and capped to preserve robotic structure)
        const speed = Math.sqrt(vx * vx + vy * vy);
        const squashY = Math.min(1.06, 1 + speed * 0.003);
        const squashX = Math.max(0.95, 1 - speed * 0.002);

        // 2.5D directional paper-flip horizontal scale
        const targetScaleX = squashX * this.currentFacing;

        gsap.to(this.creatureEl, {
            rotationX: rotX,
            rotationY: rotY,
            rotationZ: rotZ,
            scaleX: targetScaleX,
            scaleY: squashY,
            duration: 0.25,
            ease: 'power1.out',
            overwrite: 'auto',
        });

        // Head look direction tilts slightly with travel direction
        if (this.headEl && (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1)) {
            const headAngle = Math.max(-15, Math.min(15, vx * 0.8 * this.currentFacing));
            gsap.to(this.headEl, { rotation: headAngle, duration: 0.2, ease: 'power1.out' });
        }

        this.prevX = cx;
        this.prevY = cy;
    }

    private _updateStateClasses(stateClass: string, expClass: BusinessExpression = 'neutral'): void {
        if (!this.shell) return;

        const classesToRemove: string[] = [];
        this.shell.classList.forEach((cls) => {
            if (cls.startsWith('state-') || cls.startsWith('exp-')) {
                classesToRemove.push(cls);
            }
        });
        classesToRemove.forEach((cls) => this.shell?.classList.remove(cls));

        this.shell.classList.add(`state-${stateClass}`);
        const finalExp = expClass !== 'neutral' ? expClass : this.activeExpression;
        if (finalExp !== 'neutral') {
            this.shell.classList.add(`exp-${finalExp}`);
        }
    }

    setExpression(expr: BusinessExpression): void {
        if (!this.shell) return;
        this.activeExpression = expr;

        // Remove existing expressions
        this.shell.classList.remove('exp-confirming', 'exp-empathetic', 'exp-thinking', 'exp-error');

        if (expr !== 'neutral') {
            this.shell.classList.add(`exp-${expr}`);
        }

        if (expr === 'confirming') {
            this._playSynthBeep(520, 'sine', 0.08);
        } else if (expr === 'error') {
            this._playSynthBeep(220, 'triangle', 0.12);
        } else if (expr === 'thinking') {
            this._playSynthBeep(360, 'sine', 0.06);
        }
    }

    private _releaseButton(): void {
        if (this.carriedBtn && this.btnParent) {
            this.carriedBtn.style.opacity = '0';
            this.carriedBtn.style.pointerEvents = 'none';
            if (this.btnSibling) {
                this.btnParent.insertBefore(this.carriedBtn, this.btnSibling);
            } else {
                this.btnParent.appendChild(this.carriedBtn);
            }
        }
        this.carriedBtn = null;
        this.btnParent = null;
        this.btnSibling = null;
        if (this.buttonSlot) this.buttonSlot.innerHTML = '';
    }

    private _killFlight(): void {
        if (this.flightTl) {
            this.flightTl.kill();
            this.flightTl = null;
        }
        if (this.buttonFloatTl) {
            this.buttonFloatTl.kill();
            this.buttonFloatTl = null;
        }
    }

    private _initMouseTracking(): void {
        window.addEventListener(
            'mousemove',
            (e) => {
                if (window.innerWidth <= 1024) return;
                if (!this.creatureEl || !this.shell) return;

                const rect = this.creatureEl.getBoundingClientRect();
                const robotCenterX = rect.left + rect.width / 2;
                const robotCenterY = rect.top + rect.height / 2;

                const dx = e.clientX - robotCenterX;
                const dy = e.clientY - robotCenterY;
                const angle = Math.atan2(dy, dx);

                // Track cursor on visor/eyes/head when she is IDLE or hovered
                if (this.state === State.IDLE || this.isHovered) {
                    // 1. Move individual eyes inside the visor slightly (max 2px)
                    const eyes = this.creatureEl.querySelectorAll(
                        '.robot-eye'
                    ) as NodeListOf<HTMLElement>;
                    eyes.forEach((eye) => {
                        const eyeX = Math.cos(angle) * 2;
                        const eyeY = Math.sin(angle) * 2;
                        eye.style.setProperty('--eye-offset-x', `${eyeX}px`);
                        eye.style.setProperty('--eye-offset-y', `${eyeY}px`);
                    });

                    // 2. Translate the Visor in 3D perspective to create organic depth
                    const visor = this.creatureEl.querySelector('.robot-visor') as HTMLElement;
                    if (visor) {
                        const visorX = Math.cos(angle) * 5;
                        const visorY = Math.sin(angle) * 2.5;
                        visor.style.setProperty('--visor-offset-x', `${visorX}px`);
                        visor.style.setProperty('--visor-offset-y', `${visorY}px`);
                    }

                    // 3. Head tracking: gentle rotation towards cursor
                    if (this.headEl) {
                        const maxRotation = 12; // max angle in degrees
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const strength = Math.min(0.2, 100 / (distance + 1)); // scale rotation strength
                        const targetRotation = Math.max(
                            -maxRotation,
                            Math.min(maxRotation, dx * strength)
                        );
                        gsap.to(this.headEl, {
                            rotation: targetRotation,
                            duration: 0.5,
                            ease: 'power2.out',
                        });
                    }
                }
            },
            { passive: true }
        );
    }

    private _handleHoverStart(): void {
        if (window.innerWidth <= 1024) return;
        this.isHovered = true;

        // Reset facing factors smoothly to front
        this.facing = 1;
        this.currentFacing = 1;

        // Smoothly ease body posture to frontal upright state
        if (this.creatureEl) {
            gsap.to(this.creatureEl, {
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                scaleX: 1,
                scaleY: 1,
                duration: 0.45,
                ease: 'power2.out',
            });
        }

        // 1. Decelerate flight to a soft halt if currently flying/wandering
        if (this.flightTl && this.flightTl.isActive()) {
            gsap.to(this.flightTl, {
                timeScale: 0,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    if (this.isHovered) {
                        this.flightTl?.pause();
                    }
                },
            });
        }

        // Clear wander timer so she doesn't initiate a new flight while hovered
        if (this.wanderTimer) {
            clearTimeout(this.wanderTimer);
            this.wanderTimer = null;
        }

        // 2. Transition float loop into low-intensity breathing motion smoothly
        if (this.floater) {
            // Smoothly ease floater rotation and y position to zero
            gsap.to(this.floater, {
                y: 0,
                rotation: 0,
                duration: 0.45,
                ease: 'power2.out',
                onComplete: () => {
                    if (!this.isHovered) return;
                    this._stopFloat();

                    // Create an ultra-gentle, slow breathing float loop while hovered
                    this.hoverFloatTl = gsap.timeline({ repeat: -1, yoyo: true });
                    this.hoverFloatTl.to(this.floater, {
                        y: -3,
                        duration: 3.2,
                        ease: 'sine.inOut',
                    });
                    this.hoverFloatTl.to(
                        this.floater,
                        {
                            rotation: 0.5,
                            duration: 3.8,
                            ease: 'sine.inOut',
                        },
                        0
                    );
                },
            });
        }
    }

    private _handleHoverEnd(): void {
        if (window.innerWidth <= 1024) return;
        this.isHovered = false;

        // 1. Resume flight smoothly if it was paused
        if (this.flightTl) {
            this.flightTl.play();
            gsap.to(this.flightTl, {
                timeScale: 1,
                duration: 0.6,
                ease: 'power2.inOut',
            });
        }

        // 2. Kill subtle hover breathe and smoothly ease back to standard float
        if (this.hoverFloatTl) {
            this.hoverFloatTl.kill();
            this.hoverFloatTl = null;
        }

        // Transition back to standard floating smoothly
        if (this.floater) {
            gsap.to(this.floater, {
                y: 0,
                rotation: 0,
                duration: 0.45,
                ease: 'power2.out',
                onComplete: () => {
                    if (this.isHovered) return;
                    this._startIdleFloat();
                },
            });
        }

        // 3. If she is IDLE and was wandering, schedule her next wander flight
        if (this.state === State.IDLE && this.isWandering && !this.wanderTimer) {
            this.wanderTimer = setTimeout(
                () => {
                    if (!this.isHovered) {
                        this._wanderNext();
                    }
                },
                3000 + Math.random() * 2000
            );
        }
    }

    private _initClickInteraction(): void {
        this.creatureEl?.addEventListener('click', () => {
            if (window.innerWidth <= 1024) return;
            if (this.isAcknowledgingClick || !this.shell || !this.floater || !this.creatureEl) return;
            this.isAcknowledgingClick = true;

            const prevExpr = this.activeExpression;
            this.setExpression('confirming');
            this.creatureEl.classList.add('popping');

            if (this.brain) {
                this.brain.makeDecision('assistant_click');
            }

            const acknowledgeTl = gsap.timeline({
                onComplete: () => {
                    this.creatureEl?.classList.remove('popping');
                    this.isAcknowledgingClick = false;
                    this.setExpression(prevExpr);
                },
            });

            acknowledgeTl
                .to(this.floater, {
                    y: -5,
                    rotation: 1.2,
                    duration: 0.18,
                    ease: 'power2.out',
                })
                .to(this.floater, { y: 0, rotation: 0, duration: 0.28, ease: 'power2.inOut' });
        });
    }

    private _getAudioContext(): AudioContext | null {
        if (!this.audioCtx) {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AC) {
                this.audioCtx = new AC();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
    }

    private _playSynthBeep(freq: number, type: OscillatorType, duration: number, delay = 0): void {
        try {
            if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
            const ctx = this._getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime + delay;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch {
            /* silent */
        }
    }

    private _hasWelcomedThisSession(): boolean {
        try {
            return sessionStorage.getItem('tl_welcomed') === 'true';
        } catch {
            return false;
        }
    }

    private _setWelcomedThisSession(): void {
        try {
            sessionStorage.setItem('tl_welcomed', 'true');
        } catch {}
    }

    private _playWelcomeSequence(): void {
        if (!this.shell || !this.creatureEl || !this.floater || !this.mover) return;

        // Set initial scale to 0 and transparent for a premium pop-in entrance
        gsap.set(this.creatureEl, { scale: 0, opacity: 0 });
        gsap.set(this.mover, { x: 0, y: 0 });

        this._stopFloat();

        const welcomeTl = gsap.timeline({
            delay: 1.0, // wait 1 second after page load for maximum visual impact
            onStart: () => {
                this.state = State.FLYING;
                this._updateStateClasses('flying', 'confirming');
                this.setExpression('confirming');
                // Play a restrained digital tri-tone welcome cue
                this._playSynthBeep(523.25, 'sine', 0.15); // C5
                setTimeout(() => this._playSynthBeep(659.25, 'sine', 0.15), 100); // E5
                setTimeout(() => this._playSynthBeep(783.99, 'sine', 0.25), 200); // G5
            }
        });

        // 1. Cinematic pop-in at home corner
        welcomeTl.to(this.creatureEl, {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: 'back.out(1.5)'
        });

        // Calculate center coordinates relative to home corner anchor
        const shellRect = this.shell.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isAr = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        const offsetMultiplier = isAr ? 1 : -1;
        
        // Offset horizontally so the welcome notepad (width 250px) centers beautifully alongside the robot
        const targetX = (vw / 2) - (shellRect.left + shellRect.width / 2) + (offsetMultiplier * 80);
        const targetY = (vh / 2) - (shellRect.top + shellRect.height / 2) - 40;

        this.prevX = 0;
        this.prevY = 0;

        // 2. organic curved flight from home corner to center of Section S1
        welcomeTl.to(this.mover, {
            duration: 2.0,
            ease: 'power2.inOut',
            motionPath: {
                path: [
                    { x: targetX * 0.3, y: targetY * 0.5 - 100 }, // curve upward
                    { x: targetX * 0.7, y: targetY * 0.85 - 50 },
                    { x: targetX, y: targetY }
                ],
                curviness: 1.5,
                type: 'soft'
            },
            onUpdate: () => this._applyProceduralTilt(),
            onComplete: () => {
                this.state = State.PRESENTING;
                this._updateStateClasses('guiding', 'confirming');

                // Settle and reset body velocity tilts smoothly
                gsap.to(this.tiltWrap, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                if (this.headEl) {
                    gsap.to(this.headEl, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                }
                gsap.to(this.creatureEl, {
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    scaleX: isAr ? -1 : 1,
                    scaleY: 1,
                    duration: 0.4,
                    ease: 'power2.out'
                });
                this.facing = 1;
                this.currentFacing = 1;

                this.welcomeCompleted = false;

                // Build a polished glassmorphic welcome notepad card
                const lang = TranslinkLanguageController.getInstance();
                const curLang = lang.getLanguage();
                let headerText = "TRANSLINK SOLUTIONS";
                let subText = "Welcome Visitor!";
                let descText = "Your One-Stop Solution for Fleet Telematics & IoT across East Africa.";
                let bullets = [
                    "✓ ECA & FTA Certified",
                    "✓ GPS & Fuel Monitoring",
                    "✓ AI-Driven Video Safety",
                    "✓ 24/7 Support Team"
                ];
                let align = 'left';

                if (curLang === 'am') {
                    headerText = "ትራንስሊንክ መፍትሔዎች";
                    subText = "እንኳን ደህና መጡ!";
                    descText = "በምስራቅ አፍሪካ ለተሽከርካሪ ስምሪት ቁጥጥር እና IoT የተሟላ መፍትሔ።";
                    bullets = [
                        "✓ በ ECA እና FTA ፈቃድ ያለው",
                        "✓ የጂፒኤስ እና ነዳጅ ቁጥጥር",
                        "✓ በ AI የተደገፈ የቪዲዮ ደህንነት",
                        "✓ የ24/7 የቴክኒክ ድጋፍ"
                    ];
                } else if (curLang === 'ar') {
                    headerText = "ترانسلينك للحلول";
                    subText = "أهلاً بك زائرنا!";
                    descText = "حلولك الشاملة لتتبع المركبات و IoT في شرق أفريقيا.";
                    bullets = [
                        "✓ مرخص من ECA و FTA",
                        "✓ تتبع GPS ومراقبة الوقود",
                        "✓ السلامة بالفيديو المدعوم بالذكاء الاصطناعي",
                        "✓ دعم فني على مدار الساعة"
                    ];
                    align = 'right';
                }

                const notepad = document.createElement('div');
                notepad.id = 'tl-welcome-notepad';
                notepad.className = 'tl-notepad-card';
                notepad.style.cssText = `
                    width: 250px;
                    padding: 16px;
                    background: linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 12, 0.98) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.15);
                    color: #ffffff;
                    font-family: 'Inter', sans-serif;
                    text-align: ${align};
                    pointer-events: auto;
                    backdrop-filter: blur(10px);
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    direction: ${curLang === 'ar' ? 'rtl' : 'ltr'};
                `;

                notepad.innerHTML = `
                    <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.15em; color: var(--brand-crimson); text-transform: uppercase;">
                        ${headerText}
                    </div>
                    <div style="font-size: 16px; font-weight: 900; color: #ffffff;">
                        ${subText}
                    </div>
                    <div style="height: 1px; background: linear-gradient(90deg, var(--brand-crimson), transparent); margin: 2px 0;"></div>
                    <p style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin: 0; padding: 0;">
                        ${descText}
                    </p>
                    <ul style="list-style: none; padding: 0; margin: 4px 0 0 0; display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #e2e8f0; font-weight: 500; text-align: ${align};">
                        ${bullets.map(b => `<li style="display: flex; align-items: center; gap: 6px; justify-content: ${align === 'right' ? 'flex-end' : 'flex-start'};">${b}</li>`).join('')}
                    </ul>
                `;

                if (this.buttonSlot) {
                    this.buttonSlot.innerHTML = '';
                    this.buttonSlot.appendChild(notepad);
                    this.isHoldingNotepad = true;
                    this.state = State.PRESENTING;
                    this._animateButtonPresentation();
                }

                // BUG FIX #1: Automatically connect and play the welcome — but pass welcome=false
                // because we are sending the prompt text ourselves via sendText().
                // Passing welcome=true would cause the SERVER to also fire its own welcome prompt, doubling it.
                this._autoConnectAndPrompt(
                    `Welcome the visitor warmly. In your greeting, clearly say that Translink is the ONE STOP SOLUTION for fleet telematics, GPS tracking, fuel management, and AI-driven safety across East Africa. Keep it to 2 short, natural sentences. Sound calm, premium, professional, and helpful. Invite them to ask a fleet-related question.`,
                    "confirming"
                );
            }
        }, '-=0.2');

        // Cute greeting hand wave sequence
        const activeHand = this.creatureEl.querySelector(
            isAr ? '.robot-hand.r' : '.robot-hand.l'
        ) as HTMLElement | null;

        if (activeHand) {
            welcomeTl.to(activeHand, {
                rotation: isAr ? -60 : 60,
                duration: 0.35,
                ease: 'power2.out',
                yoyo: true,
                repeat: 3, // Wave hand back and forth!
                onComplete: () => {
                    gsap.set(activeHand, { clearProps: 'all' });
                    this.setExpression('neutral');
                }
            }, '-=0.5');
        }
    }

    private _initScrollTracking(): void {
        this.handleScroll = () => {
            if (window.innerWidth <= 1024) return;
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
            }
            if (this.scrollIdleTimer) {
                clearTimeout(this.scrollIdleTimer);
            }

            // If we are holding the welcome notepad and user scrolls past S1, return home
            if (this.isHoldingNotepad && window.scrollY > 50 && this.state === State.PRESENTING) {
                this.isHoldingNotepad = false;
                this.returnHome();
            }

            // --- Scroll interaction state synchronization for Telemetry Button ---
            // The telemetry button is only fully visible and interactive while active scrolling is happening.
            if (this.buttonSlot && this.carriedBtn && this.state === State.PRESENTING) {
                gsap.to(this.buttonSlot, {
                    opacity: 1,
                    scale: 1,
                    pointerEvents: 'auto',
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            }

            // If we are currently wandering, scrolling immediately returns us home
            if (this.isWandering && this.state === State.IDLE) {
                this._returnFromWander();
            }

            // 1. Hide the telemetry button after 1.5 seconds of no scrolling
            this.scrollTimer = setTimeout(() => {
                if (this.buttonSlot && this.carriedBtn && this.state === State.PRESENTING) {
                    gsap.to(this.buttonSlot, {
                        opacity: 0,
                        scale: 0.8,
                        pointerEvents: 'none',
                        duration: 0.5,
                        ease: 'power2.inOut',
                        overwrite: 'auto'
                    });
                }
            }, 1500);

            // 2. Start wandering cycle after 10 seconds of no scrolling
            this.scrollIdleTimer = setTimeout(() => {
                if (this.state === State.IDLE && !this.isWandering) {
                    this._startWanderingCycle();
                }
            }, 10000);
        };

        window.addEventListener('scroll', this.handleScroll, { passive: true });

        // Trigger initial check
        this.handleScroll();
    }

    private _startWanderingCycle(): void {
        if (this.state !== State.IDLE) return;
        this.isWandering = true;
        this._wanderNext();
    }

    private _wanderNext(): void {
        if (this.isHovered) return;
        if (!this.mover || !this.shell || this.state !== State.IDLE || !this.isWandering) return;

        const isAr = TranslinkLanguageController.getInstance().getLanguage() === 'ar';
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Choose a random coordinate relative to bottom-right (LTR) or bottom-left (RTL) home anchor
        // Keep a comfortable 150px safety boundary from viewport edges at all times
        const targetX = isAr
            ? Math.max(40, Math.min(vw - 150, Math.random() * (vw - 190) + 40))
            : -Math.max(40, Math.min(vw - 150, Math.random() * (vw - 190) + 40));
        const targetY = -Math.max(40, Math.min(vh - 150, Math.random() * (vh - 190) + 40));

        this._killFlight();
        this._stopFloat();

        this._updateStateClasses('flying', 'confirming');
        this._playSynthBeep(350, 'sine', 0.3);

        const startX = gsap.getProperty(this.mover, 'x') as number;
        const startY = gsap.getProperty(this.mover, 'y') as number;
        this.prevX = startX;
        this.prevY = startY;

        this.flightTl = gsap.timeline({
            onUpdate: () => this._applyProceduralTilt(),
            onComplete: () => {
                this._updateStateClasses('idle', 'neutral');
                // Reset tilts smoothly
                gsap.to(this.tiltWrap, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                if (this.headEl) {
                    gsap.to(this.headEl, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                }
                gsap.to(this.creatureEl, {
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    scaleX: this.facing > 0 ? 1 : -1,
                    scaleY: 1,
                    duration: 0.4,
                    ease: 'power2.out',
                });
                this.facing = 1;
                this.currentFacing = 1;

                this._startIdleFloat();

                // Wait 4-6 seconds before wandering to the next spot
                this.wanderTimer = setTimeout(
                    () => {
                        this._wanderNext();
                    },
                    4000 + Math.random() * 2000
                );
            },
        });

        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Math.max(1.5, Math.min(3.5, dist / 250)); // speed proportional to distance

        this.flightTl.to(this.mover, {
            duration,
            ease: 'power2.inOut',
            motionPath: {
                path: [
                    { x: startX + dx * 0.3, y: startY + dy * 0.3 - 50 },
                    { x: startX + dx * 0.7, y: targetY + 30 },
                    { x: targetX, y: targetY },
                ],
                curviness: 1.2,
                type: 'soft',
            },
        });
    }

    private _returnFromWander(): void {
        this.isWandering = false;
        if (this.wanderTimer) {
            clearTimeout(this.wanderTimer);
            this.wanderTimer = null;
        }

        if (this.state !== State.IDLE || !this.mover) return;

        this._killFlight();
        this._stopFloat();
        this._updateStateClasses('flying', 'confirming');
        this._playSynthBeep(450, 'sine', 0.2);

        const startX = gsap.getProperty(this.mover, 'x') as number;
        const startY = gsap.getProperty(this.mover, 'y') as number;
        this.prevX = startX;
        this.prevY = startY;

        this.flightTl = gsap.timeline({
            onUpdate: () => this._applyProceduralTilt(),
            onComplete: () => {
                // Reset tilts smoothly
                gsap.to(this.tiltWrap, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                if (this.headEl) {
                    gsap.to(this.headEl, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                }
                gsap.to(this.creatureEl, {
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    scaleX: this.facing > 0 ? 1 : -1,
                    scaleY: 1,
                    duration: 0.4,
                    ease: 'power2.out',
                });
                this.facing = 1;
                this.currentFacing = 1;

                this._startIdleFloat();
            },
        });

        const dx = -startX;
        const dy = -startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Math.max(1.2, Math.min(2.5, dist / 300));

        this.flightTl.to(this.mover, {
            duration,
            ease: 'power2.inOut',
            motionPath: {
                path: [
                    { x: startX * 0.6, y: startY * 0.6 - 40 },
                    { x: 0, y: 0 },
                ],
                curviness: 1.0,
                type: 'soft',
            },
        });
    }

    private _ensureVoiceManager(): TranslinkVoiceManager {
        if (!this.voiceManager) {
            this.voiceManager = new TranslinkVoiceManager({
                onStateChange: (state) => this._handleVoiceStateChange(state),
                onTranscription: (text) => this._handleVoiceTranscription(text),
                onError: (err) => this._handleVoiceError(err),
                onSetupComplete: () => this._onVoiceSetupComplete(),
                onMetric: (name, value) => this._handleVoiceMetric(name, value),
            });
        }

        return this.voiceManager;
    }

    private async _toggleVoiceSession(): Promise<void> {
        const vm = this._ensureVoiceManager();

        if (vm.isConnected()) {
            // Session active: disconnect it on second click (acts as toggle-off)
            console.log('[Companion] Emblem clicked — voice session active, disconnecting.');
            vm.disconnect();
            return;
        }

        console.log('[Companion] Emblem clicked — initiating chat voice session.');
        this._setWelcomedThisSession();
        if (this.brain) {
            this.brain.makeDecision('voice_link_open');
        }

        this._isAutomatedSession = false;
        this._pendingChatGreeting = true;
        this._pendingAutomatedPrompt = null;
        await vm.connect(false, true);
    }

    private _handleVoiceStateChange(voiceState: VoiceState): void {
        if (!this.creatureEl) return;

        switch (voiceState) {
            case 'connecting':
                this._stopLipSync();
                this._updateStateClasses('thinking', 'neutral');
                this._playSynthBeep(450, 'triangle', 0.25);
                break;

            case 'listening':
                this._stopLipSync();
                this._updateStateClasses('listening', 'neutral');

                // Welcome-complete guard: only fires AFTER _robotHasSpoken is true.
                // _robotHasSpoken is set when the first 'speaking' state fires.
                // This prevents the guide prompt and auto-disconnect from triggering
                // on the initial WS open (which also emits a 'listening' state).
                if (this._isAutomatedSession) {
                    if (!this.welcomeGuideDelivered && this._robotHasSpoken) {
                        this.welcomeCompleted = true;
                        this.welcomeGuideDelivered = true;
                        // Safe to mark welcomed NOW — robot has actually spoken.
                        this._setWelcomedThisSession();

                        // Pulse the emblem to guide visitor to click it.
                        if (this.emblemEl) {
                            this.emblemEl.classList.add('emblem-pulse-guide');
                        }

                        // Guide prompt fires after welcome speaking ends (we are now in listening).
                        setTimeout(() => {
                            if (this.voiceManager && this.voiceManager.isConnected()) {
                                this.voiceManager.sendText(
                                    `Now gently tell the visitor: to start talking with you, they just need to click the glowing red Translink logo on your body. Say it in one calm, professional sentence.`
                                );
                                this.setExpression('confirming');
                            }
                        }, 800);
                    } else if (this.welcomeGuideDelivered && this.welcomeCompleted && this._robotHasSpoken) {
                        // This is triggered the moment the guide speech finishes playing and state transitions back to 'listening'!
                        console.log('[Companion] Guide verbal announcement complete — disconnecting, returning to idle.');
                        this.returnHome();
                        if (this.voiceManager && this.voiceManager.isConnected()) {
                            this.voiceManager.disconnect();
                        }
                    }
                }
                break;

            case 'speaking':
                // Mark that the robot has spoken at least once in this session.
                // This is the gate that unlocks the welcome-complete logic above.
                this._robotHasSpoken = true;
                this._startLipSync();
                this._updateStateClasses('speaking', 'confirming');
                break;

            case 'idle':
                this._stopLipSync();
                this._robotHasSpoken = false; // reset for next session
                if (this.state === State.IDLE || this.state === State.RETURNING) {
                    this._updateStateClasses('idle', 'neutral');
                }
                this._playSynthBeep(250, 'sine', 0.2);
                break;
        }
    }

    private _handleVoiceTranscription(text: string): void {
        // Voice transcription is purely vocal now - no UI/text speech bubbles are rendered!
        console.log('[Companion] Live Voice Transcription heard:', text);
    }

    private _handleVoiceError(error: string): void {
        console.error('[Companion] Voice session error:', error);
        this._updateStateClasses('alert', 'error');
        this._playSynthBeep(180, 'triangle', 0.18);

        setTimeout(() => {
            this._updateStateClasses('idle', 'neutral');
        }, 4000);
    }

    private _handleVoiceMetric(name: string, value?: number | string): void {
        console.log('[Companion] Voice metric:', { name, value, timestamp: performance.now() });
    }

    private _startLipSync(): void {
        this._stopLipSync();
        if (!this.mouthEl) return;
        
        this.mouthEl.style.opacity = '1';
        
        const loop = () => {
            if (this.voiceManager && this.voiceManager.getState() === 'speaking') {
                const volume = this.voiceManager.getPlaybackVolume();
                
                // Animate mouth scale Y based on real-time volume
                const scaleY = 1 + volume * 15;
                const scaleX = 1 + volume * 2;
                this.mouthEl!.style.transform = `translateX(-50%) translateZ(8px) scale(${scaleX}, ${scaleY})`;
                
                // Dynamically change mouth color based on active expression
                let mouthColor = '#00d2ff'; // brand-cyan
                if (this.activeExpression === 'error') mouthColor = '#ffb84d';
                else if (this.activeExpression === 'confirming') mouthColor = '#00d2ff';
                else if (this.activeExpression === 'empathetic') mouthColor = '#9be7ff';
                
                this.mouthEl!.style.background = mouthColor;
                this.mouthEl!.style.boxShadow = `0 0 ${8 + volume * 15}px ${mouthColor}`;

                // Visor glow and pulse in lockstep
                const visor = this.creatureEl?.querySelector('.robot-visor') as HTMLElement | null;
                if (visor) {
                    visor.style.boxShadow = `inset 0 2px 5px rgba(0, 0, 0, 0.8), 0 0 ${10 + volume * 30}px ${mouthColor}`;
                }
                
                // Emblem pulse in lockstep
                const emblem = this.creatureEl?.querySelector('.robot-emblem') as HTMLElement | null;
                if (emblem) {
                    emblem.style.transform = `translateZ(3px) scale(${1 + volume * 0.35})`;
                    let emblemGlow = 'var(--brand-crimson)';
                    if (this.activeExpression === 'confirming') emblemGlow = 'var(--brand-cyan)';
                    emblem.style.boxShadow = `0 0 ${12 + volume * 40}px ${emblemGlow}`;
                }

                this.lipSyncRafId = requestAnimationFrame(loop);
            } else {
                this._stopLipSync();
            }
        };
        loop();
    }

    private _stopLipSync(): void {
        if (this.lipSyncRafId !== null) {
            cancelAnimationFrame(this.lipSyncRafId);
            this.lipSyncRafId = null;
        }
        if (this.mouthEl) {
            this.mouthEl.style.opacity = '0';
            this.mouthEl.style.transform = 'translateX(-50%) translateZ(8px) scale(1, 1)';
        }
        
        // Reset visor and emblem styles
        const visor = this.creatureEl?.querySelector('.robot-visor') as HTMLElement | null;
        if (visor) {
            visor.style.boxShadow = '';
        }
        const emblem = this.creatureEl?.querySelector('.robot-emblem') as HTMLElement | null;
        if (emblem) {
            emblem.style.transform = 'translateZ(3px) scale(1)';
            emblem.style.boxShadow = '';
        }
    }

    private _onVoiceSetupComplete(): void {
        if (!this.voiceManager) return;

        console.log('[Companion] Voice session setup complete. Handling pending queues.');
        if (this._pendingChatGreeting) {
            this._pendingChatGreeting = false;
            this.voiceManager.sendText(
                `The visitor has just clicked to start a conversation with you. Greet them in one calm, professional, warm sentence. Ask what fleet operation, safety, fuel, or tracking question you can help with. Do not re-introduce yourself or replay the welcome.`
            );
            this.setExpression('confirming');
            this._playSynthBeep(440, 'sine', 0.15);
        } else if (this._pendingAutomatedPrompt) {
            const prompt = this._pendingAutomatedPrompt;
            const expr = this._pendingAutomatedExpression;
            this._pendingAutomatedPrompt = null;

            this.voiceManager.sendText(prompt);
            this.setExpression(expr);
        }
    }

    private _autoConnectAndPrompt(promptText: string, emotion: BusinessExpression): void {
        const voiceManager = this._ensureVoiceManager();
        this.setExpression(emotion);

        if (this.isWandering && this.state === State.IDLE) {
            this._returnFromWander();
        }

        this._isAutomatedSession = true;
        this._pendingChatGreeting = false;
        this._pendingAutomatedPrompt = promptText;
        this._pendingAutomatedExpression = emotion;

        voiceManager.connect(false, false).catch(err => {
            console.error('[Companion] Failed auto connect voice:', err);
        });
    }

    destroy(): void {
        this._killFlight();
        this._stopFloat();
        this._stopLipSync();
        if (this.hoverFloatTl) {
            this.hoverFloatTl.kill();
            this.hoverFloatTl = null;
        }
        this._releaseButton();
        if (this.scrollTimer) {
            clearTimeout(this.scrollTimer);
            this.scrollTimer = null;
        }
        if (this.scrollIdleTimer) {
            clearTimeout(this.scrollIdleTimer);
            this.scrollIdleTimer = null;
        }
        if (this.wanderTimer) {
            clearTimeout(this.wanderTimer);
            this.wanderTimer = null;
        }
        if (this.handleScroll) {
            window.removeEventListener('scroll', this.handleScroll);
            this.handleScroll = null;
        }
        if (this.voiceManager) {
            this.voiceManager.disconnect();
            this.voiceManager = null;
        }
        if (this.brain) {
            this.brain.destroy();
            this.brain = null;
        }

        this.styleTag?.remove();
        this.shell?.remove();
        if (this.audioCtx) {
            this.audioCtx.close().catch(() => {});
            this.audioCtx = null;
        }
        this.shell = this.mover = this.tiltWrap = this.floater = null;
        this.creatureEl = this.buttonSlot = this.styleTag = this.headEl = null;
        TranslinkEasterEggFriend.instance = null;
    }
}
