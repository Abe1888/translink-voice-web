export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  remaining?: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

class RateLimitService {
  private buckets = new Map<string, Bucket>();
  private activeVoiceSessions = new Map<string, number>();

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      this.trimBuckets(now);
      return { allowed: true, remaining: Math.max(0, limit - 1) };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfterMs: existing.resetAt - now,
        remaining: 0,
      };
    }

    existing.count++;
    return {
      allowed: true,
      remaining: Math.max(0, limit - existing.count),
    };
  }

  tryAcquireVoiceSession(ip: string, maxConcurrent: number): boolean {
    const current = this.activeVoiceSessions.get(ip) || 0;
    if (current >= maxConcurrent) return false;
    this.activeVoiceSessions.set(ip, current + 1);
    return true;
  }

  releaseVoiceSession(ip: string): void {
    const current = this.activeVoiceSessions.get(ip) || 0;
    if (current <= 1) {
      this.activeVoiceSessions.delete(ip);
      return;
    }
    this.activeVoiceSessions.set(ip, current - 1);
  }

  getActiveVoiceSessions(ip?: string): number {
    if (ip) return this.activeVoiceSessions.get(ip) || 0;
    let total = 0;
    this.activeVoiceSessions.forEach((count) => {
      total += count;
    });
    return total;
  }

  private trimBuckets(now: number): void {
    if (this.buckets.size < 5000) return;
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

export const rateLimitService = new RateLimitService();
