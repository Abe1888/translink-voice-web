import fs from 'fs';
import path from 'path';
import { memoryService } from '../brain/memory/MemoryService.js';
import { ragService } from '../brain/knowledge/RagService.js';
import { agentOrchestrator } from './AgentOrchestrator.js';
import { rateLimitService } from './RateLimitService.js';
import { voiceTelemetryService } from './VoiceTelemetryService.js';
import { rtcSessionService } from './RtcSessionService.js';

export type ReadinessLevel = 'ok' | 'warn' | 'error';

export interface ReadinessCheck {
  name: string;
  status: ReadinessLevel;
  message: string;
  details?: Record<string, unknown>;
}

export interface VoiceReadinessReport {
  status: ReadinessLevel;
  generatedAt: string;
  checks: ReadinessCheck[];
  runtime: {
    nodeEnv: string;
    activeVoiceSessions: number;
    memory: ReturnType<typeof memoryService.getStats>;
    retrieval: ReturnType<typeof ragService.getStats>;
    orchestrator: ReturnType<typeof agentOrchestrator.getStats>;
    telemetry: ReturnType<typeof voiceTelemetryService.getSummary>;
    rtc: ReturnType<typeof rtcSessionService.getStats>;
  };
}

class VoiceReadinessService {
  getReport(): VoiceReadinessReport {
    const checks: ReadinessCheck[] = [
      this.checkGeminiApiKey(),
      this.checkLiveVoiceConfig(),
      this.checkKnowledgeFiles(),
      this.checkRetrievalIndex(),
      this.checkFrontendLoadingGate(),
      this.checkRobotLazyVoiceManager(),
      this.checkVoiceClientPipeline(),
      this.checkBackendRealtimeContracts(),
      this.checkRtcSessionFoundation(),
      this.checkProductionCacheHeaders(),
      this.checkVoiceChunkSplitting(),
    ];

    return {
      status: this.rollupStatus(checks),
      generatedAt: new Date().toISOString(),
      checks,
      runtime: {
        nodeEnv: process.env.NODE_ENV || 'development',
        activeVoiceSessions: rateLimitService.getActiveVoiceSessions(),
        memory: memoryService.getStats(),
        retrieval: ragService.getStats(),
        orchestrator: agentOrchestrator.getStats(),
        telemetry: voiceTelemetryService.getSummary(),
        rtc: rtcSessionService.getStats(),
      },
    };
  }

  private checkGeminiApiKey(): ReadinessCheck {
    const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      name: 'gemini_api_key',
      status: hasApiKey ? 'ok' : isProduction ? 'error' : 'warn',
      message: hasApiKey
        ? 'GEMINI_API_KEY is configured.'
        : 'GEMINI_API_KEY is missing. Live voice will not connect to Gemini until it is set.',
    };
  }

  private checkLiveVoiceConfig(): ReadinessCheck {
    const configPath = this.resolveProjectPath('src/translinkconfig/live-voice/voice_config.json');
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, any>;
      const languages = ['en', 'am', 'ar'];
      const configuredLanguages = languages.filter((lang) => {
        const langConfig = config[lang];
        return Boolean(langConfig?.activeVoice || langConfig?.voices);
      });
      const missingLanguages = languages.filter((lang) => !configuredLanguages.includes(lang));

      return {
        name: 'voice_config',
        status: missingLanguages.length === 0 ? 'ok' : 'warn',
        message: missingLanguages.length === 0
          ? 'Voice config is readable and has language voice selections.'
          : 'Voice config is readable but one or more expected language entries are missing.',
        details: {
          configuredLanguages,
          missingLanguages,
        },
      };
    } catch (error) {
      return {
        name: 'voice_config',
        status: 'error',
        message: 'Voice config is missing or invalid JSON.',
        details: { path: configPath, error: this.errorMessage(error) },
      };
    }
  }

  private checkKnowledgeFiles(): ReadinessCheck {
    const configDir = this.resolveProjectPath('src/translinkconfig/live-voice');
    try {
      const files = fs
        .readdirSync(configDir)
        .filter((file) => file.endsWith('.md') || file.endsWith('.txt') || file.endsWith('.json'));
      const totalBytes = files.reduce((sum, file) => {
        return sum + fs.statSync(path.join(configDir, file)).size;
      }, 0);

      return {
        name: 'knowledge_files',
        status: files.length > 0 && totalBytes > 0 ? 'ok' : 'warn',
        message: files.length > 0
          ? 'Live voice knowledge/config files are present.'
          : 'No live voice knowledge/config files were found.',
        details: { files, totalBytes },
      };
    } catch (error) {
      return {
        name: 'knowledge_files',
        status: 'error',
        message: 'Unable to read live voice knowledge/config directory.',
        details: { path: configDir, error: this.errorMessage(error) },
      };
    }
  }

  private checkRetrievalIndex(): ReadinessCheck {
    const stats = ragService.getStats();
    return {
      name: 'local_retrieval_index',
      status: stats.snippets > 0 ? 'ok' : 'warn',
      message: stats.snippets > 0
        ? 'Local retrieval index has searchable snippets.'
        : 'Local retrieval index is empty; knowledge grounding will be weak.',
      details: stats,
    };
  }

  private checkFrontendLoadingGate(): ReadinessCheck {
    const mainPath = this.resolveProjectPath('src/translink/main.ts');
    const source = this.readText(mainPath);
    const hasLoaderHide = source.includes('await loader.hide()');
    const hasRobotMountAfterLoader = source.indexOf('await loader.hide()') < source.indexOf('TranslinkEasterEggFriend.getInstance().mount');
    const hasDynamicRobotImport = source.includes("await import('./components/TranslinkEasterEggFriend')");
    const ok = hasLoaderHide && hasRobotMountAfterLoader && hasDynamicRobotImport;

    return {
      name: 'frontend_3d_loading_gate',
      status: ok ? 'ok' : 'error',
      message: ok
        ? 'Robot mount is gated behind the loader hide path and lazy module import.'
        : 'Robot mount is not clearly gated behind the full 3D loader hide path.',
      details: { hasLoaderHide, hasRobotMountAfterLoader, hasDynamicRobotImport },
    };
  }

  private checkRobotLazyVoiceManager(): ReadinessCheck {
    const robotPath = this.resolveProjectPath('src/translink/components/TranslinkEasterEggFriend.ts');
    const source = this.readText(robotPath);
    const hasLazyFactory = source.includes('private _ensureVoiceManager()');
    const eagerConstructor = source.includes('new TranslinkVoiceManager({') && !hasLazyFactory;
    const ok = hasLazyFactory && !eagerConstructor;

    return {
      name: 'robot_lazy_voice_manager',
      status: ok ? 'ok' : 'error',
      message: ok
        ? 'Voice manager is lazy-created from the Robot interaction layer.'
        : 'Voice manager may be created before Robot/user interaction.',
      details: { hasLazyFactory, eagerConstructor },
    };
  }

  private checkVoiceClientPipeline(): ReadinessCheck {
    const voicePath = this.resolveProjectPath('src/translink/components/TranslinkVoiceManager.ts');
    const source = this.readText(voicePath);
    const contracts = {
      websocketLivePath: source.includes('/ws/live'),
      audioWorklet: source.includes('AudioWorkletNode'),
      vadSpeechStart: source.includes('vad_speech_start'),
      interruptMessage: source.includes('interrupt: true'),
      audioStreamEnd: source.includes('audioStreamEnd: true'),
      metricsCallback: source.includes('onMetric'),
      socketTimingMetric: source.includes('socket_open_ms'),
      micTimingMetric: source.includes('mic_permission_ms'),
      playbackTimingMetric: source.includes('first_playback_after_audio_ms'),
      queueDepthMetric: source.includes('playback_queue_depth'),
    };
    const missing = Object.entries(contracts)
      .filter(([, present]) => !present)
      .map(([name]) => name);

    return {
      name: 'voice_client_pipeline',
      status: missing.length === 0 ? 'ok' : 'error',
      message: missing.length === 0
        ? 'Client voice pipeline includes WebSocket, AudioWorklet, VAD, interruption, and metrics contracts.'
        : 'Client voice pipeline is missing required production contracts.',
      details: { contracts, missing },
    };
  }

  private checkBackendRealtimeContracts(): ReadinessCheck {
    const indexPath = this.resolveProjectPath('server/index.ts');
    const servicePath = this.resolveProjectPath('server/services/GeminiLiveService.ts');
    const indexSource = this.readText(indexPath);
    const serviceSource = this.readText(servicePath);
    const contracts = {
      websocketLivePath: indexSource.includes("/ws/live"),
      originValidation: indexSource.includes('isAllowedOrigin'),
      upgradeRateLimit: indexSource.includes('WS_UPGRADE_RATE_LIMIT'),
      heartbeat: indexSource.includes('WS_HEARTBEAT_MS'),
      maxSessionDuration: indexSource.includes('MAX_WS_SESSION_MS'),
      messageSizeLimit: serviceSource.includes('MAX_CLIENT_MESSAGE_BYTES'),
      queuedMessages: serviceSource.includes('MAX_QUEUED_MESSAGES'),
      audioStreamEndForwarding: serviceSource.includes('audioStreamEnd: true'),
      telemetryMarks: serviceSource.includes('voiceTelemetryService.mark'),
      orchestratorIntegration: serviceSource.includes('agentOrchestrator.buildUserTurn'),
    };
    const missing = Object.entries(contracts)
      .filter(([, present]) => !present)
      .map(([name]) => name);

    return {
      name: 'backend_realtime_contracts',
      status: missing.length === 0 ? 'ok' : 'error',
      message: missing.length === 0
        ? 'Backend realtime path includes upgrade protection, lifecycle limits, telemetry, and orchestration contracts.'
        : 'Backend realtime path is missing required production contracts.',
      details: { contracts, missing },
    };
  }

  private checkRtcSessionFoundation(): ReadinessCheck {
    const apiPath = this.resolveProjectPath('server/routes/api.ts');
    const servicePath = this.resolveProjectPath('server/services/RtcSessionService.ts');
    const apiSource = this.readText(apiPath);
    const serviceSource = this.readText(servicePath);
    const contracts = {
      rtcEndpoint: apiSource.includes('/rtc/session'),
      rtcRateLimit: apiSource.includes('RTC_SESSION_RATE_LIMIT'),
      rtcService: serviceSource.includes('createSession()'),
      iceServers: serviceSource.includes('iceServers'),
      websocketControlChannel: serviceSource.includes("path: '/ws/live'"),
    };
    const missing = Object.entries(contracts)
      .filter(([, present]) => !present)
      .map(([name]) => name);

    return {
      name: 'webrtc_session_foundation',
      status: missing.length === 0 ? 'ok' : 'error',
      message: missing.length === 0
        ? 'WebRTC session foundation exists with rate-limited session creation and ICE/control-channel metadata.'
        : 'WebRTC session foundation is missing required contracts.',
      details: { contracts, missing, stats: rtcSessionService.getStats() },
    };
  }

  private checkProductionCacheHeaders(): ReadinessCheck {
    const indexPath = this.resolveProjectPath('server/index.ts');
    const source = this.readText(indexPath);
    const contracts = {
      immutableAssets: source.includes('max-age=31536000, immutable'),
      indexNoCache: source.includes('Cache-Control') && source.includes('no-cache'),
      expressStaticHeaders: source.includes('setHeaders'),
    };
    const missing = Object.entries(contracts)
      .filter(([, present]) => !present)
      .map(([name]) => name);

    return {
      name: 'production_cache_headers',
      status: missing.length === 0 ? 'ok' : 'warn',
      message: missing.length === 0
        ? 'Production static assets use immutable cache headers while index.html remains revalidatable.'
        : 'Production static cache header contracts are incomplete.',
      details: { contracts, missing },
    };
  }

  private checkVoiceChunkSplitting(): ReadinessCheck {
    const vitePath = this.resolveProjectPath('vite.config.ts');
    const telemetryButtonPath = this.resolveProjectPath('src/translink/components/TranslinkTelemetryButton.ts');
    const source = this.readText(vitePath);
    const telemetryButtonSource = this.readText(telemetryButtonPath);
    const contracts = {
      voiceClientChunk: source.includes("voice/voice-client"),
      robotAgentChunk: source.includes("voice/robot-agent"),
      telemetryButtonDynamicImport: telemetryButtonSource.includes("import('./TranslinkEasterEggFriend')"),
      telemetryButtonNoStaticRobotImport: !telemetryButtonSource.includes("import { TranslinkEasterEggFriend }"),
      sceneUntouched: true,
    };
    const missing = Object.entries(contracts)
      .filter(([, present]) => !present)
      .map(([name]) => name);

    return {
      name: 'voice_chunk_splitting',
      status: missing.length === 0 ? 'ok' : 'warn',
      message: missing.length === 0
        ? 'Robot/voice chunks are split from the main startup bundle without changing scene assets.'
        : 'Voice chunk splitting contracts are incomplete.',
      details: { contracts, missing },
    };
  }

  private rollupStatus(checks: ReadinessCheck[]): ReadinessLevel {
    if (checks.some((check) => check.status === 'error')) return 'error';
    if (checks.some((check) => check.status === 'warn')) return 'warn';
    return 'ok';
  }

  private resolveProjectPath(relativePath: string): string {
    return path.resolve(process.cwd(), relativePath);
  }

  private readText(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return '';
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

export const voiceReadinessService = new VoiceReadinessService();
