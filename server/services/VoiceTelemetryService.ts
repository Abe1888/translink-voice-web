export type VoiceTelemetryEventName =
  | 'session_started'
  | 'gemini_connected'
  | 'setup_complete'
  | 'first_client_audio'
  | 'first_model_audio'
  | 'first_model_text'
  | 'client_audio_stream_end'
  | 'client_metric'
  | 'client_interrupt'
  | 'server_interrupted'
  | 'turn_complete'
  | 'error'
  | 'session_closed';

export interface VoiceTelemetryEvent {
  timestamp: string;
  sessionId: string;
  name: VoiceTelemetryEventName;
  data?: Record<string, unknown>;
}

export interface VoiceSessionTelemetry {
  sessionId: string;
  lang: string;
  voice: string;
  welcome: boolean;
  startedAt: number;
  closedAt?: number;
  closeCode?: number;
  closeReason?: string;
  durations: {
    geminiConnectMs?: number;
    setupCompleteMs?: number;
    firstClientAudioMs?: number;
    firstModelAudioMs?: number;
    firstModelTextMs?: number;
    clientSocketOpenMs?: number;
    clientSetupCompleteFromSocketMs?: number;
    clientFirstAudioFromConnectMs?: number;
    clientFirstAudioFromSocketMs?: number;
    clientMicPermissionMs?: number;
    clientFirstPlaybackAfterAudioMs?: number;
  };
  counters: {
    clientAudioFrames: number;
    modelAudioChunks: number;
    modelTextMessages: number;
    clientAudioStreamEnds: number;
    clientInterruptions: number;
    serverInterruptions: number;
    turnCompletions: number;
    errors: number;
    socketErrors: number;
    micPermissionFailures: number;
    playbackInterruptions: number;
  };
  clientMetrics: Array<{
    name: string;
    value?: number | string;
    clientTimestamp?: number;
    receivedAt: number;
  }>;
  lastEventAt: number;
}

class VoiceTelemetryService {
  private sessions = new Map<string, VoiceSessionTelemetry>();
  private recentEvents: VoiceTelemetryEvent[] = [];
  private readonly maxSessions = Number(process.env.VOICE_TELEMETRY_MAX_SESSIONS || 200);
  private readonly maxEvents = Number(process.env.VOICE_TELEMETRY_MAX_EVENTS || 1000);
  private readonly maxClientMetricsPerSession = Number(
    process.env.VOICE_TELEMETRY_MAX_CLIENT_METRICS || 80
  );

  startSession(sessionId: string, meta: { lang: string; voice: string; welcome: boolean }): void {
    const now = Date.now();
    this.sessions.set(sessionId, {
      sessionId,
      lang: meta.lang,
      voice: meta.voice,
      welcome: meta.welcome,
      startedAt: now,
      durations: {},
      counters: {
        clientAudioFrames: 0,
        modelAudioChunks: 0,
        modelTextMessages: 0,
        clientAudioStreamEnds: 0,
        clientInterruptions: 0,
        serverInterruptions: 0,
        turnCompletions: 0,
        errors: 0,
        socketErrors: 0,
        micPermissionFailures: 0,
        playbackInterruptions: 0,
      },
      clientMetrics: [],
      lastEventAt: now,
    });
    this.recordEvent(sessionId, 'session_started', meta);
    this.trimSessions();
  }

  mark(sessionId: string, name: VoiceTelemetryEventName, data: Record<string, unknown> = {}): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const now = Date.now();
    const elapsedMs = now - session.startedAt;
    session.lastEventAt = now;

    switch (name) {
      case 'gemini_connected':
        if (session.durations.geminiConnectMs !== undefined) return;
        session.durations.geminiConnectMs ??= elapsedMs;
        break;
      case 'setup_complete':
        if (session.durations.setupCompleteMs !== undefined) return;
        session.durations.setupCompleteMs ??= elapsedMs;
        break;
      case 'first_client_audio':
        if (session.durations.firstClientAudioMs !== undefined) return;
        session.durations.firstClientAudioMs ??= elapsedMs;
        break;
      case 'first_model_audio':
        if (session.durations.firstModelAudioMs !== undefined) return;
        session.durations.firstModelAudioMs ??= elapsedMs;
        break;
      case 'first_model_text':
        if (session.durations.firstModelTextMs !== undefined) return;
        session.durations.firstModelTextMs ??= elapsedMs;
        break;
      case 'client_audio_stream_end':
        session.counters.clientAudioStreamEnds++;
        break;
      case 'client_interrupt':
        session.counters.clientInterruptions++;
        break;
      case 'server_interrupted':
        session.counters.serverInterruptions++;
        break;
      case 'turn_complete':
        session.counters.turnCompletions++;
        break;
      case 'error':
        session.counters.errors++;
        break;
    }

    this.recordEvent(sessionId, name, { elapsedMs, ...data });
  }

  increment(sessionId: string, counter: keyof VoiceSessionTelemetry['counters'], by = 1): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.counters[counter] += by;
    session.lastEventAt = Date.now();
  }

  recordClientMetric(
    sessionId: string,
    metric: { name?: unknown; value?: unknown; timestamp?: unknown }
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session || typeof metric.name !== 'string') return;

    const receivedAt = Date.now();
    const value =
      typeof metric.value === 'number' || typeof metric.value === 'string'
        ? metric.value
        : undefined;
    const clientTimestamp = typeof metric.timestamp === 'number' ? metric.timestamp : undefined;

    this.applyClientMetric(session, metric.name, value);

    session.clientMetrics.push({
      name: metric.name,
      value,
      clientTimestamp,
      receivedAt,
    });
    if (session.clientMetrics.length > this.maxClientMetricsPerSession) {
      session.clientMetrics = session.clientMetrics.slice(-this.maxClientMetricsPerSession);
    }

    this.mark(sessionId, 'client_metric', { metric: metric.name, value });
  }

  closeSession(sessionId: string, closeCode?: number, closeReason?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.closedAt = Date.now();
    session.closeCode = closeCode;
    session.closeReason = closeReason;
    session.lastEventAt = session.closedAt;
    this.recordEvent(sessionId, 'session_closed', {
      closeCode,
      closeReason,
      durationMs: session.closedAt - session.startedAt,
    });
  }

  getSnapshot(): { active: VoiceSessionTelemetry[]; recentEvents: VoiceTelemetryEvent[] } {
    const sessions = Array.from(this.sessions.values());
    return {
      active: sessions
        .filter((session) => !session.closedAt)
        .sort((a, b) => b.startedAt - a.startedAt),
      recentEvents: this.recentEvents.slice(-100),
    };
  }

  getSummary(): Record<string, unknown> {
    const sessions = Array.from(this.sessions.values());
    const active = sessions.filter((session) => !session.closedAt);
    const completed = sessions.filter((session) => session.closedAt);
    const avgDurationMs =
      completed.length === 0
        ? 0
        : Math.round(
            completed.reduce(
              (sum, session) => sum + ((session.closedAt || session.startedAt) - session.startedAt),
              0
            ) / completed.length
          );

    return {
      activeSessions: active.length,
      retainedSessions: sessions.length,
      completedSessions: completed.length,
      avgDurationMs,
      avgGeminiConnectMs: this.averageDuration(sessions, 'geminiConnectMs'),
      avgSetupCompleteMs: this.averageDuration(sessions, 'setupCompleteMs'),
      avgFirstModelAudioMs: this.averageDuration(sessions, 'firstModelAudioMs'),
      avgClientSocketOpenMs: this.averageDuration(sessions, 'clientSocketOpenMs'),
      avgClientFirstAudioFromConnectMs: this.averageDuration(sessions, 'clientFirstAudioFromConnectMs'),
      avgClientMicPermissionMs: this.averageDuration(sessions, 'clientMicPermissionMs'),
      avgClientFirstPlaybackAfterAudioMs: this.averageDuration(sessions, 'clientFirstPlaybackAfterAudioMs'),
      totalErrors: sessions.reduce((sum, session) => sum + session.counters.errors, 0),
      totalClientInterruptions: sessions.reduce(
        (sum, session) => sum + session.counters.clientInterruptions,
        0
      ),
      totalClientAudioStreamEnds: sessions.reduce(
        (sum, session) => sum + session.counters.clientAudioStreamEnds,
        0
      ),
      totalSocketErrors: sessions.reduce((sum, session) => sum + session.counters.socketErrors, 0),
      totalMicPermissionFailures: sessions.reduce(
        (sum, session) => sum + session.counters.micPermissionFailures,
        0
      ),
      totalPlaybackInterruptions: sessions.reduce(
        (sum, session) => sum + session.counters.playbackInterruptions,
        0
      ),
    };
  }

  private applyClientMetric(
    session: VoiceSessionTelemetry,
    name: string,
    value?: number | string
  ): void {
    if (typeof value === 'number') {
      switch (name) {
        case 'socket_open_ms':
          session.durations.clientSocketOpenMs ??= Math.round(value);
          break;
        case 'setup_complete_from_socket_ms':
          session.durations.clientSetupCompleteFromSocketMs ??= Math.round(value);
          break;
        case 'first_audio_from_connect_ms':
          session.durations.clientFirstAudioFromConnectMs ??= Math.round(value);
          break;
        case 'first_audio_from_socket_ms':
          session.durations.clientFirstAudioFromSocketMs ??= Math.round(value);
          break;
        case 'mic_permission_ms':
          session.durations.clientMicPermissionMs ??= Math.round(value);
          break;
        case 'first_playback_after_audio_ms':
          session.durations.clientFirstPlaybackAfterAudioMs ??= Math.round(value);
          break;
      }
    }

    switch (name) {
      case 'socket_error':
        session.counters.socketErrors++;
        break;
      case 'mic_permission_failed':
        session.counters.micPermissionFailures++;
        break;
      case 'playback_interrupted':
        session.counters.playbackInterruptions++;
        break;
    }
  }

  private averageDuration(
    sessions: VoiceSessionTelemetry[],
    key: keyof VoiceSessionTelemetry['durations']
  ): number {
    const values = sessions
      .map((session) => session.durations[key])
      .filter((value): value is number => typeof value === 'number');
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private recordEvent(
    sessionId: string,
    name: VoiceTelemetryEventName,
    data?: Record<string, unknown>
  ): void {
    const event: VoiceTelemetryEvent = {
      timestamp: new Date().toISOString(),
      sessionId,
      name,
      data,
    };
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents = this.recentEvents.slice(-this.maxEvents);
    }
    console.log(JSON.stringify({ type: 'voice_telemetry', ...event }));
  }

  private trimSessions(): void {
    if (this.sessions.size <= this.maxSessions) return;
    const closed = Array.from(this.sessions.values())
      .filter((session) => session.closedAt)
      .sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0));

    while (this.sessions.size > this.maxSessions && closed.length > 0) {
      const oldest = closed.shift();
      if (oldest) this.sessions.delete(oldest.sessionId);
    }
  }
}

export const voiceTelemetryService = new VoiceTelemetryService();
