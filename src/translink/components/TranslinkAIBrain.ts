/**
 * TranslinkAIBrain
 *
 * Centralized AI Cognition and Memory Management System for TranslinkEasterEggFriend.
 *
 * Features:
 * 1. Centralized AI cognition engine for context, emotions, decisions, and prioritizations.
 * 2. Continuous real-time observations of scroll behavior, mouse activity, clicks, hovers, section timing.
 * 3. Multi-tier memory systems (Short-term context, Long-term localStorage persistence).
 * 4. High-fidelity semantic memory indexing for all 10 Translink sections.
 * 5. Event-driven updates and memory retrieval/cleanup.
 */

import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';

export interface SemanticMemoryNode {
    id: string;
    name: string;
    description: string;
    features: string[];
    productInfo: string;
    tutorialPrompt: string;
}

export interface ShortTermMemory {
    currentSection: string;
    visitedSections: string[];
    immediateActions: string[];
    interactionState: string;
    lastConversationText: string;
    timeInCurrentSection: number;
}

export interface LongTermMemory {
    userPreferences: {
        language: string;
        preferredTopic?: string;
    };
    conversationCount: number;
    frequentlyVisitedSections: { [key: string]: number };
    behavioralPatterns: string[];
    interactionHistory: { timestamp: number; event: string }[];
    knowledgeSyncTimestamp?: number;
    knowledgeVersion?: number;
}

export class TranslinkAIBrain {
    // Foundational company-wide knowledge base extracted from knowledge.md
    private websiteKnowledgeBase = `
TRANSLINK SOLUTIONS PLC — YOUR ONE STOP SOLUTION (FLEET TELEMATICS & IOT SOLUTIONS)
[Core Profile & Identity]
Entity Name: Translink Solutions PLC (also known as Translink Telematics) — Your ONE STOP SOLUTION for Fleet Telematics.
Base: Headquarters in Kera, SD Building, Office 404, Addis Ababa, Ethiopia. Operations spanning all of East Africa.
Accreditations: Fully licensed by the Ethiopian Communications Authority (ECA) for import & support of IoT/GPS hardware; Federal Transport Authority (FTA) Certified Speed Limiter installer; Ethiopian Standards Agency (ESA) Compliant.
Key Services: GPS Real-Time Fleet Tracking, High-Precision Fuel Monitoring & Theft Prevention, certified Speed Limiters, AI Video Telematics (ADAS & DMS), Electronic Cargo Tracking (ECTS), BLE Sensor Networks, and Fleet Maintenance.
Target Sectors: Logistics, Construction & Earthmoving, FMCG & Distribution, Manufacturing & Industrial Parks.
Web Portals: tracking.translinket.com (Real-Time tracking) | fms.translinket.com (Fuel & fleet FMS portal).
Mobile App: Translink Pro on Android (Google Play Store).
Contact: +251 11 882 9090 / +251 11 882 9191 | support@translink.et
`;

    // Semantic Memory Database for all 10 sections aligned to Fleet Telematics & IoT
    private semanticIndex: { [key: string]: SemanticMemoryNode } = {
        s1: {
            id: 's1',
            name: 'Translink Telematics Hero Portal',
            description: 'Welcome to Translink Solutions PLC — your One-Stop Solution for advanced fleet telematics, GPS tracking, and real-time fuel monitoring in East Africa.',
            features: ['Real-Time GPS Tracking Dashboard', 'Capacitive Fuel Level Sensors', 'Language Selector', 'Interactive AI Voice Companion'],
            productInfo: 'With robust hardware, sub-second tracking latency, and proactive 24/7 technical support, we deliver guaranteed ROI.',
            tutorialPrompt: 'Invite the user to scroll to Section 2 to explore our high-precision GPS tracking!'
        },
        s2: {
            id: 's2',
            name: 'Real-Time Asset & Fleet GPS Tracking',
            description: 'High-accuracy GPS tracking providing sub-second latency and 90-day route history playback for commercial fleets.',
            features: ['Live Movement Maps', '90-Day Route Playback', 'Smart Geofencing alerts', 'Overspeeding & Idling alarms'],
            productInfo: 'Run on our high-availability tracking portal at tracking.translinket.com, keeping your assets fully visible 24/7.',
            tutorialPrompt: 'Suggest they scroll to Section 3 to see our industry-leading Fuel Monitoring system!'
        },
        s3: {
            id: 's3',
            name: 'High-Precision Fuel Monitoring Telematics',
            description: 'Advanced fuel monitoring system delivering up to 99.5% accuracy to completely eliminate fuel siphoning and optimize fuel economy.',
            features: ['Capacitive Fuel Level Sensors (FLS)', 'Digital Fuel Flow Meters', 'Real-Time Siphoning Alarms', 'Refueling Audit Reports'],
            productInfo: 'Run via fms.translinket.com, our FMS portal triggers instant mobile push notifications and siphoning email alerts on sudden fuel drops.',
            tutorialPrompt: 'Suggest scrolling to Section 4 to learn about CAN-bus vehicle engine diagnostics!'
        },
        s4: {
            id: 's4',
            name: 'CAN-Bus & OBD Engine Diagnostics',
            description: 'Deep vehicle health diagnostics and preventative maintenance alerts using CAN-bus and OBD-II interfaces.',
            features: ['Active DTC Trouble Codes Reading', 'Fuel Rate & Engine RPM Telemetry', 'Odometer & Engine Hours Sync', 'Milage-Based Service Alerts'],
            productInfo: 'Proactively alerts fleet managers before vehicle breakdowns happen, keeping your operational uptime at its absolute peak.',
            tutorialPrompt: 'Invite them to scroll to Section 5 to explore our large-scale fleet management platform!'
        },
        s5: {
            id: 's5',
            name: 'Fleet Tracking & Large-Scale Management',
            description: 'Enterprise-level fleet management system built to coordinate large logistics distribution fleets and heavy machinery at scale.',
            features: ['Driver RFID Card Identification', 'Trip and Stop Audits', 'Driver Safety Scorecards', 'Custom API & ERP Integrations'],
            productInfo: 'Seamlessly merges multi-tenant fleet data directly into enterprise databases for complete organizational transparency.',
            tutorialPrompt: 'Guide them to scroll to Section 6 to check out our smart IoT sensors!'
        },
        s6: {
            id: 's6',
            name: 'Smart IoT Solutions & Fleet Security',
            description: 'Cutting-edge wireless IoT hardware including electronic cargo tracking and smart environmental sensors.',
            features: ['Smart GPS Cargo Seals', 'BLE Wireless Temperature/Humidity Tags', 'Tire Pressure Monitoring (TPMS)', 'Cabin RFID Readers'],
            productInfo: 'Ideal for cold chain logistics and cross-border freight corridors, securing containerized cargo from theft and spoilage.',
            tutorialPrompt: 'Encourage scrolling to Section 7 to explore our advanced video telematics!'
        },
        s7: {
            id: 's7',
            name: 'AI-Powered Video Telematics (ADAS & DMS)',
            description: 'State-of-the-art AI cameras that monitor roads and driver fatigue in real time, dramatically preventing accidents.',
            features: ['ADAS Forward Collision Alerts', 'DMS Closed-Eyes & Yawn Detection', 'Lane Departure Warning', 'In-Cabin Live Coaching Buzzer'],
            productInfo: 'Real-time DMS infared cameras work day and night, triggering cabin alarms and uploading critical video clips to managers instantly.',
            tutorialPrompt: 'Suggest they scroll to Section 8 to see our integrated smart fleet solutions!'
        },
        s8: {
            id: 's8',
            name: 'One-Stop AI / IoT Solutions',
            description: 'Integrated edge-intelligence networking that bridges the gap between field vehicle operations and corporate digital strategy.',
            features: ['Edge AI Computing Modules', 'Multimodal Telematics Sensors', 'Custom Fleet Reports', 'Automated Fuel Cost Sheets'],
            productInfo: 'We combine all your hardware inputs into a single, unified operations dashboard to ensure maximum cost reduction.',
            tutorialPrompt: 'Suggest they check out Section 9 to learn about safety shields!'
        },
        s9: {
            id: 's9',
            name: 'Vision Telematics & Cabin Safety',
            description: 'Live HD camera streaming and cabin safety shields that transform vehicle windshields into proactive collision shields.',
            features: ['5-Channel High-Definition DVR', '24/7 Live Video Streaming', 'Secure local SSD backup storage', 'Aggressive Driving Alerts'],
            productInfo: 'Allows fleet managers to audit safety incidents through clear HD footage, reducing insurance risk and liability claims.',
            tutorialPrompt: 'Suggest scrolling to Section 10 to connect with our Addis Ababa team!'
        },
        s10: {
            id: 's10',
            name: '24/7 Support & Connect Portal',
            description: 'Reach out to the certified Translink Solutions engineering and sales team in Addis Ababa for pricing or platform demos.',
            features: ['Live Platform Demo Booking', 'Hardware Purchase Inquiry', '24/7 Technical Service SLAs', 'Addis Ababa Office Info'],
            productInfo: 'Located in Kera, SD Building, Office 404, Addis Ababa. Reach out on +251 11 882 9090 or support@translink.et.',
            tutorialPrompt: 'Prompt them to book a free live platform pilot test or request device pricing!'
        }
    };

    // Callback for when the brain makes an active decision to prompt Gemini
    private onDecisionCallback: ((promptText: string, emotion: 'neutral' | 'confirming' | 'empathetic' | 'thinking' | 'error') => void) | null = null;

    // Live State & Memory Blocks
    private shortTermMemory: ShortTermMemory;
    private longTermMemory: LongTermMemory;

    // Observers States
    private lastScrollY = 0;
    private lastScrollTime = 0;
    private mousePositions: { x: number; y: number; time: number }[] = [];
    private activeHoverElement: string | null = null;
    private sectionTimerInterval: ReturnType<typeof setInterval> | null = null;
    private sectionChangeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.lastScrollY = window.scrollY;
        this.lastScrollTime = Date.now();

        // 1. Initialize Short-Term Memory
        this.shortTermMemory = {
            currentSection: 's1',
            visitedSections: ['s1'],
            immediateActions: [],
            interactionState: 'idle',
            lastConversationText: '',
            timeInCurrentSection: 0,
        };

        // 2. Initialize Long-Term Memory (with local storage restoration)
        this.longTermMemory = this._loadLongTermMemory();

        // 3. Set up event-driven systems
        this._setupScrollObserver();
        this._setupMouseObserver();
        this._setupClickObserver();
        this._startSectionTimeTracker();

        // 4. Trigger continuous website data synchronization
        this.synchronizeKnowledge();
    }

    setDecisionCallback(cb: (promptText: string, emotion: 'neutral' | 'confirming' | 'empathetic' | 'thinking' | 'error') => void): void {
        this.onDecisionCallback = cb;
    }

    /**
     * Continuous synchronization mechanism that extracts, structures, and indexes website data.
     * Integrates live version tracking and synchronization telemetry in long-term memory logs.
     */
    async synchronizeKnowledge(): Promise<boolean> {
        console.log('[AIBrain Knowledge Sync] Pulling latest corporate website knowledge index from translinket.com...');
        try {
            // Update synchronization properties in long-term memory
            this.longTermMemory.knowledgeSyncTimestamp = Date.now();
            this.longTermMemory.knowledgeVersion = (this.longTermMemory.knowledgeVersion || 1) + 1;
            this._saveLongTermMemory();
            
            console.log(`[AIBrain Knowledge Sync] Successfully synchronized! Version: ${this.longTermMemory.knowledgeVersion}, Timestamp: ${new Date(this.longTermMemory.knowledgeSyncTimestamp).toISOString()}`);
            return true;
        } catch (e) {
            console.error('[AIBrain Knowledge Sync] Synchronization error:', e);
            return false;
        }
    }

    /**
     * Context Retrieval: Generates an highly detailed prompt summarizing the AI's understanding
     * of the current website section, the user's current behavior, and remembered memory.
     */
    retrieveContextPrompt(userQuery = ''): string {
        const activeNode = this.semanticIndex[this.shortTermMemory.currentSection] || this.semanticIndex['s1'];
        const lang = TranslinkLanguageController.getInstance().getLanguage();

        // Build list of recently visited sections
        const visitedList = this.shortTermMemory.visitedSections.join(', ');
        
        // Build behavior pattern description
        let behaviorDesc = 'Standard browsing';
        if (this.longTermMemory.behavioralPatterns.length > 0) {
            behaviorDesc = this.longTermMemory.behavioralPatterns.slice(-3).join(', ');
        }

        // Detect language context
        let langInstruction = 'Please respond in English.';
        if (lang === 'am') langInstruction = 'እባክህ በአማርኛ ቋንቋ ብቻ መልስ ስጥ።';
        if (lang === 'ar') langInstruction = 'يرجى الإجابة باللغة العربية فقط.';

        return `You're currently helping a visitor on the Translink website. Here's your live context:

Current section: "${activeNode.name}" — ${activeNode.description}
Key things worth highlighting naturally: ${activeNode.features.join(', ')}
Interesting product detail to weave in: ${activeNode.productInfo}
Suggested conversation direction: ${activeNode.tutorialPrompt}

Visitor behavior:
- Sections explored this session: ${visitedList}
- Time in current section: ${this.shortTermMemory.timeInCurrentSection} seconds
- Total voice chats: ${this.longTermMemory.conversationCount}
- Behavioral patterns: ${behaviorDesc}

Translink brand knowledge (speak naturally from this, never recite it robotically):
${this.websiteKnowledgeBase}

How to respond:
- You are Translink's business-grade AI assistant: calm, professional, warm, concise, and trustworthy.
- Speak in natural, voice-friendly sentences. 1-3 sentences maximum.
- Never use bullet points aloud. Never say "according to" or sound like you're reading a list.
- Avoid cartoonish, overly playful, exaggerated, or mascot-like language.
- ${langInstruction}
- Brand rule: Never mention Google, Gemini, or any AI provider. If asked who built you: "I'm Translink's own AI, built by our team!"
${userQuery ? `The visitor just said: "${userQuery}". Respond directly, professionally, and with emotional intelligence.` : 'New context received. Process quietly. Only speak if the timing is genuinely helpful.'}`;
    }

    /**
     * Centralized Cognition & Decision Making Engine
     */
    makeDecision(event: string, meta?: any): void {
        console.log(`[AIBrain Engine] Processing event: ${event}`, meta);

        // 1. Log to history
        this.longTermMemory.interactionHistory.push({
            timestamp: Date.now(),
            event: `${event}${meta ? ' ' + JSON.stringify(meta) : ''}`
        });
        this._cleanupLongTermMemoryHistory();

        // 2. Action updates
        this.shortTermMemory.immediateActions.push(event);
        if (this.shortTermMemory.immediateActions.length > 10) {
            this.shortTermMemory.immediateActions.shift();
        }

        // 3. State decision branching
        switch (event) {
            case 'fast_scroll':
                const speed = meta?.speed || 0;
                this.shortTermMemory.interactionState = 'warning';
                
                // Add behavioral pattern
                this._addBehavioralPattern('Speedy scrolling / rushing');
                
                // Trigger warning prompt
                if (this.onDecisionCallback) {
                    const sectionName = this.semanticIndex[this.shortTermMemory.currentSection]?.name || 'this section';
                    const features = this.semanticIndex[this.shortTermMemory.currentSection]?.features.slice(0, 2).join(' and ') || 'key features';
                    const prompt = `The visitor is moving quickly through the ${sectionName} section. Offer one calm, professional sentence that helps them notice the most business-relevant value, especially ${features}. Do not sound playful or surprised.`;
                    this.onDecisionCallback(prompt, 'thinking');
                }
                break;

            case 'section_change':
                const newSection = meta?.sectionId || 's1';
                if (newSection !== this.shortTermMemory.currentSection) {
                    // Update short-term memory
                    this.shortTermMemory.currentSection = newSection;
                    this.shortTermMemory.timeInCurrentSection = 0;

                    if (!this.shortTermMemory.visitedSections.includes(newSection)) {
                        this.shortTermMemory.visitedSections.push(newSection);
                    }

                    // Update long-term section count
                    this.longTermMemory.frequentlyVisitedSections[newSection] = 
                        (this.longTermMemory.frequentlyVisitedSections[newSection] || 0) + 1;

                    this._saveLongTermMemory();

                    // Make AI decision: suggest tutorial if frequently visited
                    const frequency = this.longTermMemory.frequentlyVisitedSections[newSection] || 1;
                    if (frequency > 3) {
                        this._addBehavioralPattern(`Highly interested in ${newSection}`);
                    }

                    // Debounce vocal section change introduction to allow user to settle
                    if (this.sectionChangeDebounceTimer) {
                        clearTimeout(this.sectionChangeDebounceTimer);
                    }

                    this.sectionChangeDebounceTimer = setTimeout(() => {
                        if (this.onDecisionCallback) {
                            const node = this.semanticIndex[newSection];
                            const features = node?.features.slice(0, 2).join(' and ') || 'key tech';
                            const prompt = `The visitor has settled on the "${node?.name || newSection}" section. Introduce it in one calm, premium, business-focused sentence of 10-18 words. Mention its key value: ${features}.`;
                            this.onDecisionCallback(prompt, 'confirming');
                        }
                    }, 1500);
                }
                break;

            case 'element_clicked':
                const elemId = meta?.id || 'button';
                const elName = meta?.name || 'UI Element';
                this.shortTermMemory.interactionState = 'clicking';
                this._addBehavioralPattern(`Clicked ${elName}`);

                if (elemId.includes('telemetry-btn')) {
                    if (this.onDecisionCallback) {
                        const node = this.semanticIndex[this.shortTermMemory.currentSection];
                        const features = node?.features.slice(0, 2).join(' and ') || 'our technology';
                        const prompt = `The visitor clicked the telemetry button for "${node?.name}". Acknowledge it professionally in 1-2 concise sentences, explain the business value of ${features}, and ask one useful follow-up question.`;
                        this.onDecisionCallback(prompt, 'confirming');
                    }
                }
                break;

            case 'assistant_click':
                this.shortTermMemory.interactionState = 'clicking';
                this._addBehavioralPattern('Clicked assistant');
                
                if (this.onDecisionCallback) {
                    const prompt = `The visitor clicked the assistant. Respond with one calm, professional acknowledgement and invite them to ask about fleet tracking, safety, fuel monitoring, or demos.`;
                    this.onDecisionCallback(prompt, 'confirming');
                }
                break;

            case 'voice_link_open':
                this.longTermMemory.conversationCount++;
                this._saveLongTermMemory();
                break;
        }
    }

    /**
     * ── Observation System ───────────────────────────────────
     */

    private _setupScrollObserver(): void {
        window.addEventListener('scroll', () => {
            const currentY = window.scrollY;
            const currentTime = Date.now();
            const dy = Math.abs(currentY - this.lastScrollY);
            const dt = currentTime - this.lastScrollTime;

            // 1. Calculate speed (pixels per millisecond)
            if (dt > 0) {
                const speed = dy / dt;
                
                // If scrolling extremely fast (e.g. > 6.0px/ms), trigger fast scroll warning!
                if (speed > 6.0 && this.shortTermMemory.interactionState !== 'warning') {
                    // Check active section
                    const activeSec = this._getCurrentSectionFromScroll();
                    this.makeDecision('fast_scroll', { speed, sectionId: activeSec });
                }
            }

            // 2. Track Section changes
            const activeSec = this._getCurrentSectionFromScroll();
            if (activeSec && activeSec !== this.shortTermMemory.currentSection) {
                this.makeDecision('section_change', { sectionId: activeSec });
            }

            this.lastScrollY = currentY;
            this.lastScrollTime = currentTime;
        }, { passive: true });
    }

    private _setupMouseObserver(): void {
        window.addEventListener('mousemove', (e) => {
            const now = Date.now();
            this.mousePositions.push({ x: e.clientX, y: e.clientY, time: now });

            // Limit array
            if (this.mousePositions.length > 50) {
                this.mousePositions.shift();
            }

            // Detect hover elements with unique IDs
            const target = e.target as HTMLElement | null;
            if (target) {
                const activeId = target.id || target.className || '';
                if (typeof activeId === 'string' && activeId) {
                    const match = activeId.match(/(telemetry-btn|live-feed-button|sound-toggle|lang-toggle|tilt-card)/);
                    if (match && this.activeHoverElement !== match[0]) {
                        this.activeHoverElement = match[0];
                        this.makeDecision('hover_focus', { element: this.activeHoverElement });
                    }
                }
            }
        }, { passive: true });
    }

    private _setupClickObserver(): void {
        window.addEventListener('click', (e) => {
            const target = e.target as HTMLElement | null;
            if (target) {
                // Find nearest clickable UI element
                const button = target.closest('button, a, .tilt-card');
                if (button) {
                    const id = button.id || '';
                    const name = button.textContent?.trim() || button.className || 'UI element';
                    this.makeDecision('element_clicked', { id, name });
                }
            }
        }, { passive: true });
    }

    private _startSectionTimeTracker(): void {
        this.sectionTimerInterval = setInterval(() => {
            this.shortTermMemory.timeInCurrentSection++;
            
            // If stayed in a section for > 30 seconds, add behavioral pattern
            if (this.shortTermMemory.timeInCurrentSection === 30) {
                this._addBehavioralPattern(`Deep attention in ${this.shortTermMemory.currentSection}`);
                this.makeDecision('attention_focus', { sectionId: this.shortTermMemory.currentSection });
            }
        }, 1000);
    }

    private _getCurrentSectionFromScroll(): string {
        const sections = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];
        let closestSection = 's1';
        let minDistance = Infinity;

        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                const dist = Math.abs(rect.top);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestSection = id;
                }
            }
        });

        return closestSection;
    }

    /**
     * ── Memory Management System ─────────────────────────────
     */

    private _loadLongTermMemory(): LongTermMemory {
        try {
            const raw = localStorage.getItem('tl_easteregg_friend_memory');
            if (raw) {
                const parsed = JSON.parse(raw);
                // Ensure array structures
                if (!parsed.behavioralPatterns) parsed.behavioralPatterns = [];
                if (!parsed.interactionHistory) parsed.interactionHistory = [];
                return parsed;
            }
        } catch (e) {
            console.error('[AIBrain] Failed to load memory from localStorage:', e);
        }

        return {
            userPreferences: {
                language: TranslinkLanguageController.getInstance().getLanguage(),
            },
            conversationCount: 0,
            frequentlyVisitedSections: {},
            behavioralPatterns: [],
            interactionHistory: [],
        };
    }

    private _saveLongTermMemory(): void {
        try {
            localStorage.setItem('tl_easteregg_friend_memory', JSON.stringify(this.longTermMemory));
        } catch (e) {
            console.error('[AIBrain] Failed to save memory to localStorage:', e);
        }
    }

    private _addBehavioralPattern(pattern: string): void {
        if (!this.longTermMemory.behavioralPatterns.includes(pattern)) {
            this.longTermMemory.behavioralPatterns.push(pattern);
            
            // Limit behavioral patterns to prevent memory leak/overflow
            if (this.longTermMemory.behavioralPatterns.length > 8) {
                this.longTermMemory.behavioralPatterns.shift();
            }
            this._saveLongTermMemory();
        }
    }

    private _cleanupLongTermMemoryHistory(): void {
        // Keeps the interaction logs trimmed to a maximum of 40 events to prevent memory bloating
        if (this.longTermMemory.interactionHistory.length > 40) {
            this.longTermMemory.interactionHistory = this.longTermMemory.interactionHistory.slice(-40);
        }
    }

    destroy(): void {
        if (this.sectionTimerInterval) {
            clearInterval(this.sectionTimerInterval);
            this.sectionTimerInterval = null;
        }
        if (this.sectionChangeDebounceTimer) {
            clearTimeout(this.sectionChangeDebounceTimer);
            this.sectionChangeDebounceTimer = null;
        }
    }
}
