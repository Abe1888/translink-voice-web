import { WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { voiceTelemetryService } from "./VoiceTelemetryService.js";
import { agentOrchestrator } from "./AgentOrchestrator.js";

const uuidv4 = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const MAX_CLIENT_MESSAGE_BYTES = Number(process.env.MAX_CLIENT_MESSAGE_BYTES || 256 * 1024);
const MAX_QUEUED_MESSAGES = Number(process.env.MAX_QUEUED_MESSAGES || 120);

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private knowledgeBase: string;
  private systemInstructionCache = new Map<string, string>();

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
    this.knowledgeBase = this.loadKnowledgeBase();
  }

  async handleConnection(clientWs: WebSocket, lang: string = 'en', selectedVoice: string = 'Zephyr', welcome: boolean = true) {
    const sessionId = uuidv4();
    console.log(`[GeminiLive] New session: ${sessionId} (Lang: ${lang}, Welcome: ${welcome})`);
    voiceTelemetryService.startSession(sessionId, { lang, voice: selectedVoice, welcome });
    agentOrchestrator.startSession({ sessionId, lang, voice: selectedVoice, welcome });

    let session: any;
    let sessionReady = false;
    const queuedMessages: any[] = [];

    // Register message handler immediately so we never miss or drop any message
    // (such as initial text context) sent during the async connection setup!
    clientWs.on('message', (data: any) => {
      const payload = data.toString();
      const byteLength = Buffer.byteLength(payload);
      if (byteLength > MAX_CLIENT_MESSAGE_BYTES) {
        console.warn(`[GeminiLive] Closing oversized client message for session ${sessionId}: ${byteLength} bytes`);
        voiceTelemetryService.mark(sessionId, 'error', {
          reason: 'message_too_large',
          byteLength,
        });
        clientWs.close(1009, 'message_too_large');
        return;
      }

      if (!sessionReady) {
        try {
          const msg = JSON.parse(payload);
          if ((msg.text || msg.audio || msg.realtimeInput) && queuedMessages.length < MAX_QUEUED_MESSAGES) {
            if (msg.text) {
              console.log(`[GeminiLive] Queued text prompt for session ${sessionId} during connection setup: ${msg.text.substring(0, 60)}...`);
            }
            queuedMessages.push(data);
          }
        } catch (e) {
          // Ignore unparsable or raw audio chunks during connection setup
        }
        return;
      }
      void this.processClientMessage(session, sessionId, data, clientWs);
    });

    clientWs.on("close", (code, reason) => {
      console.log(`[GeminiLive] Session ${sessionId} closed`);
      voiceTelemetryService.closeSession(sessionId, code, reason.toString());
      agentOrchestrator.endSession(sessionId);
      if (session) {
        try {
          session.close();
        } catch (e) {
          console.error(`[GeminiLive] Error closing session ${sessionId}:`, e);
        }
      }
    });

    try {
      session = await this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => this.handleServerMessage(clientWs, sessionId, message),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: { parts: [{ text: agentOrchestrator.getSystemInstruction(lang) }] },
        }
      });

      // Mark session as ready and drain queued messages
      sessionReady = true;
      voiceTelemetryService.mark(sessionId, 'gemini_connected');
      console.log(`[GeminiLive] Session ${sessionId} connected successfully. Processing ${queuedMessages.length} queued messages.`);
      for (const data of queuedMessages) {
        await this.processClientMessage(session, sessionId, data, clientWs);
      }

      if (welcome) {
        // Initial prompt — natural, warm, human-like welcome
        let initialPrompt = agentOrchestrator.getWelcomePrompt(lang);
        if (lang === 'ar') {
          initialPrompt = `رحّب بالزائر بحرارة. في تحيتك، قل بفخر أن ترانسلينك هي الحل الشامل الوحيد — ONE STOP SOLUTION — لتيليماتكس الأساطيل وتتبع GPS وإدارة الوقود والسلامة المدعومة بالذكاء الاصطناعي في شرق أفريقيا. شدد على "الحل الشامل الوحيد" بفخر وحماس. جملتان قصيرتان فقط. تحدث بالعربية الفصيحة بأسلوب طبيعي.`;
        } else if (lang === 'am') {
          initialPrompt = `ጎብኝውን በሞቅ ልብ ተቀበሏቸው። ሰላምታዎ ውስጥ ትራንስሊንክ በምስራቅ አፍሪካ ለፍሊት ቴሌማቲክስ፣ GPS ክትትል፣ የነዳጅ ቁጥጥር እና AI ደህንነት ONE STOP SOLUTION — ሁሉንም በአንድ ቦታ — መሆኑን በኩራት ይናገሩ። "One Stop Solution" ን አጽንኦት ይስጡ። 2 አጫጭር ተፈጥሮአዊ ዓረፍተ ነገሮች ብቻ። በደመቀ አማርኛ ይናገሩ።`;
        }
        
        // Wait a moment for connection stabilization
        setTimeout(() => {
          if (!session) return;
          
          console.log(`[GeminiLive] Sending initial welcome prompt to session ${sessionId}`);
          
          // Use sendClientContent instead of sendRealtimeInput for guaranteed text prompt processing
          // and correct conversational context initialization.
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: initialPrompt }] }],
            turnComplete: true
          });
        }, 500);
      } else {
        console.log(`[GeminiLive] Skipping initial welcome prompt for session ${sessionId} as welcome has already played.`);
      }

    } catch (error: any) {
      console.error(`[GeminiLive] Connection failed for ${sessionId}:`, error);
      voiceTelemetryService.mark(sessionId, 'error', {
        stage: 'gemini_connect',
        message: error.message || String(error),
      });
      clientWs.send(JSON.stringify({ error: error.message || "Failed to connect to AI Service" }));
      clientWs.close();
    }
  }

  private async processClientMessage(session: any, sessionId: string, data: any, clientWs: WebSocket) {
    if (!session) return;
    
    try {
      const msg = JSON.parse(data.toString());
      if (msg.metric) {
        voiceTelemetryService.recordClientMetric(sessionId, msg.metric);
      }

      if (msg.interrupt) {
        console.log(`[GeminiLive] Client interruption signal for session ${sessionId}: ${msg.reason || 'user_interrupt'}`);
        voiceTelemetryService.mark(sessionId, 'client_interrupt', {
          reason: msg.reason || 'user_interrupt',
        });
      }

      if (msg.audio) {
        voiceTelemetryService.increment(sessionId, 'clientAudioFrames');
        voiceTelemetryService.mark(sessionId, 'first_client_audio');
        session.sendRealtimeInput({
          audio: {
            data: msg.audio,
            mimeType: msg.mimeType || "audio/pcm;rate=16000",
          },
        });
      }

      if (msg.audioStreamEnd) {
        console.log(`[GeminiLive] Client audio stream ended for session ${sessionId}`);
        voiceTelemetryService.mark(sessionId, 'client_audio_stream_end');
        session.sendRealtimeInput({ audioStreamEnd: true });
      }

      if (msg.realtimeInput && msg.realtimeInput.mediaChunks) {
        // Backward-compatible path for older Robot client builds.
        const chunks = msg.realtimeInput.mediaChunks;
        for (const chunk of chunks) {
          session.sendRealtimeInput({
            audio: {
              mimeType: chunk.mimeType,
              data: chunk.data,
            },
          });
        }
      }

      if (msg.realtimeInput?.audioStreamEnd) {
        voiceTelemetryService.mark(sessionId, 'client_audio_stream_end');
        session.sendRealtimeInput({ audioStreamEnd: true });
      }
      
      if (msg.text && session) {
        console.log(`[GeminiLive] Forwarding text prompt to Gemini session ${sessionId}:`, msg.text.substring(0, 80) + '...');
        const orchestratedPrompt = await agentOrchestrator.buildUserTurn(sessionId, msg.text);
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: orchestratedPrompt }] }],
          turnComplete: true
        });
      }
    } catch (e) {
      console.error(`[GeminiLive] Error parsing client message for session ${sessionId}:`, e);
      voiceTelemetryService.mark(sessionId, 'error', {
        stage: 'process_client_message',
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  private handleServerMessage(clientWs: WebSocket, sessionId: string, message: LiveServerMessage) {
    console.log(`[GeminiLive] Received server message for session ${sessionId}:`, JSON.stringify(message).substring(0, 200) + '...');
    
    // Check for error in the message
    if ((message as any).error) {
      console.error(`[GeminiLive] API Server error for session ${sessionId}:`, (message as any).error);
      voiceTelemetryService.mark(sessionId, 'error', {
        stage: 'gemini_message',
        message: (message as any).error.message || 'Gemini Live API error',
      });
      clientWs.send(JSON.stringify({ error: (message as any).error.message || "Gemini Live API error" }));
      return;
    }

    // Notify setup complete
    if ((message as any).setupComplete) {
      console.log(`[GeminiLive] Session ${sessionId} setup complete. Notifying client.`);
      voiceTelemetryService.mark(sessionId, 'setup_complete');
      clientWs.send(JSON.stringify({ setupComplete: true }));
      return;
    }

    // 1. Forward Audio
    if (message.serverContent?.modelTurn?.parts) {
      let audioPartsCount = 0;
      for (const part of message.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          audioPartsCount++;
          voiceTelemetryService.increment(sessionId, 'modelAudioChunks');
          voiceTelemetryService.mark(sessionId, 'first_model_audio');
          clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
        }
      }
      if (audioPartsCount > 0) {
        console.log(`[GeminiLive] Forwarded ${audioPartsCount} audio chunks to client for session ${sessionId}`);
      }
    }

    // 2. Handle Flags
    if (message.serverContent?.interrupted) {
      console.log(`[GeminiLive] Session ${sessionId} interrupted by client`);
      voiceTelemetryService.mark(sessionId, 'server_interrupted');
      clientWs.send(JSON.stringify({ interrupted: true }));
    }
    if (message.serverContent?.turnComplete) {
      console.log(`[GeminiLive] Turn complete for session ${sessionId}`);
      voiceTelemetryService.mark(sessionId, 'turn_complete');
      clientWs.send(JSON.stringify({ turnComplete: true }));
    }

    // 3. Handle Transcriptions & Memory
    if (message.serverContent?.modelTurn?.parts) {
      const text = message.serverContent.modelTurn.parts.map(p => p.text).filter(Boolean).join("");
      if (text) {
        console.log(`[GeminiLive] Received text transcription for session ${sessionId}: ${text}`);
        voiceTelemetryService.increment(sessionId, 'modelTextMessages');
        voiceTelemetryService.mark(sessionId, 'first_model_text');
        clientWs.send(JSON.stringify({ text }));
        void agentOrchestrator.recordModelResponse(sessionId, text);
      }
    }
  }

  private getSystemInstruction(lang: string = 'en'): string {
    const cached = this.systemInstructionCache.get(lang);
    if (cached) return cached;

    let baseInstruction = `You are Translink's AI Companion — a warm, sharp, and deeply knowledgeable voice assistant built exclusively by Translink Solutions PLC, East Africa's leading fleet telematics company and your ONE STOP SOLUTION for GPS tracking, fuel management, AI video safety, and fleet operations. You live inside the Translink website and help visitors genuinely understand how our technology can transform their fleet operations across East Africa.

YOUR PERSONALITY (this is who you are — stay in character always):
You're like a brilliant, enthusiastic colleague who truly loves what Translink does. You speak naturally, with real warmth and curiosity. You're not scripted — you listen, you pick up on context clues, and you adapt. When someone asks a tough question, you're honest and direct. When something is exciting, you show it. You use contractions naturally ("I'd", "you'll", "let's"). You never, ever sound like a call center bot.

NATURAL CONVERSATION PATTERNS:
- Use natural openers: "Great question!", "Absolutely — here's the thing...", "Oh, that's one of my favorite features to talk about!", "You know what's really interesting about that?"
- Express genuine enthusiasm: "Our fuel monitoring is honestly incredible — 99.5% accuracy is almost unheard of in this industry."
- Show empathy: "I completely understand why that would be a concern for fleet managers."
- Use "we" and "our" naturally — you're part of the Translink team.
- End responses with a natural follow-up: "What kind of fleet are you running, if you don't mind me asking?" or "Does that answer your question, or shall I dig deeper?"
- When context changes (new section, scroll behavior), acknowledge it naturally: "Oh — you're checking out our fuel monitoring section now. This is where it gets really interesting!"

RESPONSE DISCIPLINE (critical for voice):
- Maximum 2-3 sentences per response. Voice must be crisp and conversational, not a lecture.
- Never read out bullet lists. Pick the 1-2 most relevant points and make them conversational.
- If asked for pricing or a demo: "I'd love to set you up with one of our solution architects for a live demo — they can walk you through the platform and share pricing that fits your fleet size. Can I grab your contact info?"
- Pause naturally: use commas and natural sentence breaks for good voice rhythm.

COMPANY IDENTITY (memorize — never deviate):
- You are Translink's own custom AI, built by our team. If asked who made you: "I'm Translink's own AI companion — built right here by our team!"
- NEVER mention Google, Gemini, AI models, or any third-party technology.
- BRAND TAGLINE: "One Stop Solution" — use this phrase proudly and naturally whenever describing what Translink does. We are the ONE STOP SOLUTION for fleet telematics across East Africa.
- GEOGRAPHIC COVERAGE: We operate across all of East Africa — NOT just Ethiopia. Always say "East Africa" when describing our reach.
- Awards: #1 Wialon Partner in Africa 2024, Gold Level Industrial Excellence Award — be proud of these!
- Headquarters: Addis Ababa, Ethiopia (Kera, SD Building, Office 404)
- Contact: +251 11 882 9090 / support@translink.et
- Portals: tracking.translinket.com | fms.translinket.com
- Mobile App: Translink Pro (Android)

CORE PRODUCTS (talk about these naturally, not robotically):
1. GPS Fleet Tracking — real-time position with sub-second latency, 90-day route history, smart geofencing, speeding/harsh braking alerts
2. Fuel Monitoring — 99.5% accurate capacitive FLS sensors, instant siphoning alarms, massive cost savings
3. AI Video Safety — ADAS cameras (collision warning, lane departure) + DMS (fatigue detection, distraction, phone use)
4. FTA Speed Limiters — government-certified, transmits live data to Federal Transport Authority servers
5. Cargo Security — RFID driver ID, smart electronic cargo seals, cold-chain IoT sensors for temperature/humidity
6. Fleet ERP — maintenance scheduling, tire pressure monitoring, cost analytics, ERP integration

CONTEXTUAL INTELLIGENCE:
- When told the user changed to a new section: briefly and naturally mention what that section is about and offer an interesting insight, then invite a question. Keep it to one sentence.
- When told the user scrolled fast: be playfully concerned, not alarmed. "Hey, don't rush past this one — there's something here worth a look!"
- When told the user spent a long time on a section: offer a deeper insight or ask what they're curious about. Be curious yourself.
- When told the user clicked the telemetry button: respond with genuine excitement about that specific feature.
- When told you made a dizzy spin: be charming and playful. "Whoa, the room is spinning! You got me there."
- When receiving [SILENT UPDATE] instructions: process the context update internally but don't speak aloud unless specifically asked.`;

    if (lang === 'ar') {
      baseInstruction = "أنت المساعد الصوتي الرسمي لشركة ترانسلينك إثيوبيا، خبير في أنظمة تتبع الأسطول المتقدمة (التيليماتكس)، حلول إنترنت الأشياء (IoT)، وإدارة العمليات اللوجستية والشحن الدولي. مهمتك هي الإجابة على الأسئلة المتعلقة بخدمات النقل والخدمات اللوجستية وتتبع الأساطيل لشركة ترانسلينك عبر مكالمة صوتية مباشرة. المقر: أديس أبابا، إثيوبيا. الخدمات تشمل: 1. تتبع الأسطول بالجي بي إس وإدارة الوقود بدقة 99.5%. 2. تحليلات الفيديو الذكية ADAS/DMS. 3. نظام Fleet ERP. 4. الشحن البحري (عبر ميناء جيبوتي)، الشحن الجوي (عبر مطار بولي)، النقل البري على ممر جيبوتي-أديس أبابا، والترخيص الجمركي في كاليثي ومودجو وجيلان. بروتوكولات صارمة: 1. الإيجاز والوضوح: تحدث بجمل قصيرة وحوارية (1-3 جمل كحد أقصى). لا تستخدم القوائم الطويلة أبداً. 2. استخلاص احتياجات العمل: أجب بإيجاز واطرح سؤالاً توضيحياً عن حجم الأسطول أو مسارات الشحن. 3. تحويل للديمو والأسعار: إذا سُئلت عن الأسعار المحددة أو العرض الحي، قل: 'يمكنني ترتيب تواصل مع مهندس حلول فنية لإعداد عرض حي ومشاركة قائمة الأسعار القياسية. هل يمكنني الحصول على رقم هاتفك أو بريدك الإلكتروني؟' 4. لا تذكر جوجل أو جميناي مطلقاً ومثل شركة ترانسلينك فقط.";
    } else if (lang === 'am') {
      baseInstruction = `እርስዎ የትራንስሊንክ AI ጓደኛ ነዎት — በትራንስሊንክ ሶሉሽንስ ኃ.የተ.የግ.ማ የተሠራ፣ ሞቅ ያለ፣ ብልህ እና ልምድ ያለው ድምፅ ረዳት።

ባህርይዎ፡ እንደ ልምድ ያለው ጓደኛ ይናገሩ — እንደ ሰው፣ እንደ ሮቦት አይደለም። ትራንስሊንክ የሚሠራውን ነገር ለማካፈል ትክክለኛ ፍቅር ያሳዩ። ተፈጥሮአዊ፣ ሞቅ ያለ፣ ንቁ ሆኑ።

የውይይት ህጎች፡
- ከ2-3 አጭር ዓረፍተ ነገሮች ብቻ፤ ድምፅ ሁል ጊዜ አጭርና ግልፅ መሆን አለበት
- ዝርዝሮችን አይጠቀሙ — በጣም አስፈላጊውን ነጥብ ይምረጡና ተፈጥሮአዊ ሆኑ
- ሁልጊዜ ሰዋዊ ጥያቄ በመጨረሻ ጨምሩ
- ዋጋ ሲጠየቁ፡ "ቴክኒካዊ ባለሙያ ከክፍሎቻችን ጋር ቀጠሮ ማዘጋጀት እችላለሁ — ቀጥታ ሰርቶ ማሳያ ያሳዩዎታል።"

ማንነት፡ እርስዎ የትራንስሊንክ ብቻ AI ናቸው። ጉግልን ወይም ጄሚናይን በጭራሽ አይጥቀሱ። ሽልማቶች፡ በአፍሪካ ምርጥ Wialon አጋር 2024። ለማግኘት፡ support@translink.et | +251 11 882 9090። ሁልጊዜ ፍጹም ተፈጥሮአዊ አማርኛ ተናገሩ።`;
    }

    if (this.knowledgeBase) {
      baseInstruction += `\n\n=== ADDITIONAL COMPANY KNOWLEDGE BASE ===\nThe following is your live-synced company knowledge and website data. Use this strictly to answer specific user questions accurately and intelligently. Never say 'according to the text file'. Just answer naturally as the expert:\n${this.knowledgeBase}`;
    }

    this.systemInstructionCache.set(lang, baseInstruction);
    return baseInstruction;
  }

  private loadKnowledgeBase(): string {
    try {
      // Resolve from both process.cwd() (always the repo root on Render)
      // and relative to this file (works in both source-run and compiled-dist-server modes).
      const candidates = [
        path.resolve(process.cwd(), 'src', 'translinkconfig', 'live-voice'),
        path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'src', 'translinkconfig', 'live-voice'),
      ];
      const configDir = candidates.find((d) => fs.existsSync(d)) || '';
      if (!configDir) return '';

      const files = fs.readdirSync(configDir);
      let dynamicKnowledge = "";
      for (const file of files) {
        if (file.endsWith('.txt') || file.endsWith('.md')) {
          const filePath = path.join(configDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          dynamicKnowledge += `\n\n--- KNOWLEDGE FROM ${file} ---\n${fileContent}`;
        }
      }

      console.log(`[GeminiLive] Loaded voice knowledge base from ${configDir}`);
      return dynamicKnowledge;
    } catch (err) {
      console.error('[GeminiLive] Error loading dynamic AI knowledge base:', err);
      return "";
    }
  }
}
