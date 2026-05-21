import { NextFunction, Request, Response, Router } from "express";
import { dashboardService } from "../brain/DashboardService.js";
import { ragService } from "../brain/knowledge/RagService.js";
import { memoryService } from "../brain/memory/MemoryService.js";
import { agentOrchestrator } from "../services/AgentOrchestrator.js";
import { voiceTelemetryService } from "../services/VoiceTelemetryService.js";
import { rateLimitService } from "../services/RateLimitService.js";
import { voiceReadinessService } from "../services/VoiceReadinessService.js";
import { rtcSessionService } from "../services/RtcSessionService.js";

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';
const TELEMETRY_RATE_LIMIT = Number(process.env.TELEMETRY_RATE_LIMIT || 60);
const TELEMETRY_RATE_WINDOW_MS = Number(process.env.TELEMETRY_RATE_WINDOW_MS || 60 * 1000);
const RTC_SESSION_RATE_LIMIT = Number(process.env.RTC_SESSION_RATE_LIMIT || 20);
const RTC_SESSION_RATE_WINDOW_MS = Number(process.env.RTC_SESSION_RATE_WINDOW_MS || 60 * 1000);
const telemetryToken = process.env.VOICE_TELEMETRY_TOKEN || process.env.ADMIN_API_TOKEN || '';

const getRequestIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const requireTelemetryAccess = (req: Request, res: Response, next: NextFunction) => {
  const ip = getRequestIp(req);
  const rateResult = rateLimitService.check(
    `voice-telemetry:${ip}`,
    TELEMETRY_RATE_LIMIT,
    TELEMETRY_RATE_WINDOW_MS
  );
  if (!rateResult.allowed) {
    res.setHeader('Retry-After', Math.ceil((rateResult.retryAfterMs || 1000) / 1000));
    res.status(429).json({ error: 'Too many telemetry requests' });
    return;
  }

  if (!isProduction) {
    next();
    return;
  }

  if (!telemetryToken) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const headerToken = req.headers['x-admin-token'];
  if (bearerToken === telemetryToken || headerToken === telemetryToken) {
    next();
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
};

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/brain/status", async (req, res) => {
  try {
    const status = await dashboardService.getBrainStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch brain status" });
  }
});

router.post("/rtc/session", (req, res) => {
  const ip = getRequestIp(req);
  const rateResult = rateLimitService.check(
    `rtc-session:${ip}`,
    RTC_SESSION_RATE_LIMIT,
    RTC_SESSION_RATE_WINDOW_MS
  );
  if (!rateResult.allowed) {
    res.setHeader('Retry-After', Math.ceil((rateResult.retryAfterMs || 1000) / 1000));
    res.status(429).json({ error: 'Too many RTC session requests' });
    return;
  }

  res.json(rtcSessionService.createSession());
});

router.get("/voice/telemetry", requireTelemetryAccess, (req, res) => {
  const includeSnapshot = req.query.detail === '1' || req.query.detail === 'true';
  res.json({
    status: "ok",
    summary: voiceTelemetryService.getSummary(),
    ...(includeSnapshot ? { snapshot: voiceTelemetryService.getSnapshot() } : {}),
  });
});

router.get("/voice/readiness", requireTelemetryAccess, (req, res) => {
  const report = voiceReadinessService.getReport();
  const httpStatus = report.status === 'error' ? 503 : 200;
  res.status(httpStatus).json(report);
});

router.get("/voice/memory", requireTelemetryAccess, (req, res) => {
  res.json({
    status: "ok",
    memory: memoryService.getStats(),
    retrieval: ragService.getStats(),
    orchestrator: agentOrchestrator.getStats(),
    rtc: rtcSessionService.getStats(),
  });
});

router.post("/voice/memory/cleanup", requireTelemetryAccess, (req, res) => {
  const requestedTtlMs = Number(req.body?.maxAgeMs);
  const removed = memoryService.cleanupExpiredSessions(
    Number.isFinite(requestedTtlMs) && requestedTtlMs > 0 ? requestedTtlMs : undefined
  );

  res.json({
    status: "ok",
    removed,
    memory: memoryService.getStats(),
  });
});

export default router;
