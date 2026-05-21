import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { GeminiLiveService } from './services/GeminiLiveService.js';
import { rateLimitService } from './services/RateLimitService.js';

// Load environment variables (no-op in production when Render injects them directly)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const isProduction = process.env.NODE_ENV === 'production';
const MAX_WS_SESSION_MS = Number(process.env.MAX_WS_SESSION_MS || 10 * 60 * 1000);
const WS_HEARTBEAT_MS = Number(process.env.WS_HEARTBEAT_MS || 30 * 1000);
const WS_UPGRADE_RATE_LIMIT = Number(process.env.WS_UPGRADE_RATE_LIMIT || 20);
const WS_UPGRADE_RATE_WINDOW_MS = Number(process.env.WS_UPGRADE_RATE_WINDOW_MS || 60 * 1000);
const WS_MAX_CONCURRENT_PER_IP = Number(process.env.WS_MAX_CONCURRENT_PER_IP || 3);

// ─── CORS ──────────────────────────────────────────────────────────────────────
// Build the allowed-origin set from APP_URL + optional ALLOWED_ORIGINS list.
const buildAllowedOrigins = (): Set<string> => {
  const origins: string[] = [];
  if (process.env.APP_URL) origins.push(process.env.APP_URL.trim());
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => origins.push(o));
  }
  return new Set(origins);
};

const allowedOrigins = buildAllowedOrigins();

if (isProduction && allowedOrigins.size === 0) {
  console.warn(
    '[Server] WARNING: APP_URL is not set. All production WebSocket connections will be rejected. ' +
    'Set APP_URL in your Render environment variables to your service URL ' +
    '(e.g. https://translink-voice-web.onrender.com).'
  );
}

// CORS middleware — applied to all /api routes so browsers can call them cross-origin if needed.
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin || '';
  const isAllowed = !isProduction || allowedOrigins.size === 0 || allowedOrigins.has(origin);
  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Common middleware
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// ─── Static + SPA ──────────────────────────────────────────────────────────────
if (isProduction) {
  // dist/ is built by `vite build` and sits at the repo root
  const distPath = path.resolve(__dirname, '..', 'dist');
  console.log(`[Server] Production mode: Serving static files from ${distPath}`);

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, {
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
          return;
        }
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }
        res.setHeader('Cache-Control', 'public, max-age=3600');
      },
    }));

    // SPA fallback — Express 5 wildcard syntax
    app.get('*any', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn(
      `[Server] Warning: 'dist' folder not found at ${distPath}. ` +
      `Make sure the build command ran successfully (npm run build).`
    );
    app.get('*any', (_req, res) => {
      res.status(503).send(
        'Frontend assets not found. Check that the build completed successfully.'
      );
    });
  }
} else {
  console.log('[Server] Development mode: API/WebSocket server running alongside Vite dev server.');
  app.get('/', (_req, res) => {
    res.send('API/WebSocket server running in development mode. Use Vite on port 3001.');
  });
}

// ─── HTTP + WebSocket Server ───────────────────────────────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

const isAllowedOrigin = (origin?: string): boolean => {
  if (!isProduction) return true;
  if (!origin) return false;
  // If APP_URL was never configured, let connections through and log a warning
  // (better than silently rejecting every user).
  if (allowedOrigins.size === 0) {
    console.warn('[Server] WS origin check skipped — APP_URL env var is not configured.');
    return true;
  }
  return allowedOrigins.has(origin);
};

const getClientIp = (
  request: express.Request | import('http').IncomingMessage
): string => {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return request.socket.remoteAddress || 'unknown';
};

const rejectUpgrade = (
  socket: { write: (chunk: string) => void; destroy: () => void },
  statusCode: number,
  reason: string,
  retryAfterMs?: number
) => {
  const retryHeader =
    retryAfterMs !== undefined ? `Retry-After: ${Math.ceil(retryAfterMs / 1000)}\r\n` : '';
  socket.write(
    `HTTP/1.1 ${statusCode} ${reason}\r\n${retryHeader}Connection: close\r\n\r\n`
  );
  socket.destroy();
};

// ─── Voice Config ──────────────────────────────────────────────────────────────
let voiceConfigCache: Record<string, any> = {};

const loadVoiceConfig = () => {
  try {
    // In production dist-server/, __dirname is <root>/dist-server/
    // The config file lives at src/translinkconfig/live-voice/voice_config.json (source tree)
    // We look for it relative to the project root (one level up from dist-server/).
    const candidates = [
      path.resolve(__dirname, '..', 'src', 'translinkconfig', 'live-voice', 'voice_config.json'),
      path.resolve(process.cwd(), 'src', 'translinkconfig', 'live-voice', 'voice_config.json'),
    ];
    for (const configPath of candidates) {
      if (fs.existsSync(configPath)) {
        voiceConfigCache = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`[Server] Voice configuration loaded from ${configPath}`);
        return;
      }
    }
    console.warn('[Server] voice_config.json not found — using default voice Zephyr.');
  } catch (err) {
    console.error('[Server] Error loading voice config:', err);
    voiceConfigCache = {};
  }
};

const getSelectedVoice = (lang: string): string => {
  const langConfig = voiceConfigCache[lang] || voiceConfigCache['en'];
  if (langConfig?.activeVoice) return langConfig.activeVoice;
  if (langConfig?.voices) {
    const active = Object.keys(langConfig.voices).find((k) => langConfig.voices[k] === 1);
    if (active) return active;
  }
  return 'Zephyr';
};

loadVoiceConfig();

// ─── WebSocket Upgrade Handler ─────────────────────────────────────────────────
httpServer.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);

    if (url.pathname === '/ws/live') {
      if (!isAllowedOrigin(request.headers.origin)) {
        console.warn(
          `[Server] WS upgrade rejected — origin '${request.headers.origin}' not in allowedOrigins. ` +
          `Configured origins: [${[...allowedOrigins].join(', ')}]. ` +
          `Check APP_URL and ALLOWED_ORIGINS env vars.`
        );
        rejectUpgrade(socket, 403, 'Forbidden');
        return;
      }

      const ip = getClientIp(request);
      const rateResult = rateLimitService.check(
        `ws-live-upgrade:${ip}`,
        WS_UPGRADE_RATE_LIMIT,
        WS_UPGRADE_RATE_WINDOW_MS
      );
      if (!rateResult.allowed) {
        rejectUpgrade(socket, 429, 'Too Many Requests', rateResult.retryAfterMs);
        return;
      }

      if (!rateLimitService.tryAcquireVoiceSession(ip, WS_MAX_CONCURRENT_PER_IP)) {
        rejectUpgrade(socket, 429, 'Too Many Concurrent Voice Sessions');
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.once('close', () => rateLimitService.releaseVoiceSession(ip));
        wss.emit('connection', ws, request);
      });
    } else {
      rejectUpgrade(socket, 404, 'Not Found');
    }
  } catch (err) {
    console.error('[Server] Upgrade processing error:', err);
    socket.destroy();
  }
});

// ─── Gemini Live Service ───────────────────────────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.error(
    '[Server] CRITICAL: GEMINI_API_KEY is not set. ' +
    'Voice sessions will fail. Set it in the Render dashboard → Environment.'
  );
}

const service = new GeminiLiveService(apiKey);

// ─── WebSocket Connection Lifecycle ───────────────────────────────────────────
wss.on('connection', async (clientWs, request) => {
  console.log('[Server] Client connected to WebSocket');

  let lang = 'en';
  let welcome = true;
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    const rawLang = url.searchParams.get('lang') || 'en';
    lang = rawLang.toLowerCase();
    if (lang !== 'en' && lang !== 'am' && lang !== 'ar') lang = 'en';
    if (url.searchParams.get('welcome') === 'false') welcome = false;
  } catch (e) {
    console.error('[Server] Error parsing connection request URL lang param:', e);
  }

  const selectedVoice = getSelectedVoice(lang);

  let isAlive = true;
  clientWs.on('pong', () => { isAlive = true; });

  const heartbeat = setInterval(() => {
    if (!isAlive) { clientWs.terminate(); return; }
    isAlive = false;
    clientWs.ping();
  }, WS_HEARTBEAT_MS);

  const maxSessionTimer = setTimeout(() => {
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(JSON.stringify({ error: 'Voice session reached the maximum duration.' }));
      clientWs.close(1000, 'max_session_duration');
    }
  }, MAX_WS_SESSION_MS);

  clientWs.on('close', () => {
    clearInterval(heartbeat);
    clearTimeout(maxSessionTimer);
  });

  try {
    console.log(
      `[Server] Handing off client to GeminiLiveService ` +
      `(lang: ${lang}, voice: ${selectedVoice}, welcome: ${welcome})`
    );
    await service.handleConnection(clientWs, lang, selectedVoice, welcome);
  } catch (err) {
    console.error('[Server] GeminiLiveService connection handoff failed:', err);
    clientWs.send(JSON.stringify({ error: 'Failed to initialize AI Service' }));
    clientWs.close();
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[Server] Server listening on http://0.0.0.0:${PORT}`);
  if (isProduction) {
    console.log(`[Server] APP_URL: ${process.env.APP_URL || '(not set — WebSocket origins may be unrestricted)'}`);
  }
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = () => {
  console.log('[Server] Shutting down gracefully...');
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({ info: 'Server shutting down' }));
      client.close();
    }
  });
  wss.close(() => {
    console.log('[Server] WebSocket server closed.');
    httpServer.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  });
  setTimeout(() => { console.error('[Server] Force exit.'); process.exit(1); }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
