// ULTRA-EXTREME SPEED: Sub-800ms total time optimization
// This module implements aggressive connection pooling, request batching, and minimal response processing

import { fetch } from "@tauri-apps/plugin-http";

// Connection pool for ultra-fast reuse
const CONNECTION_POOL = new Map<string, {
  controller: AbortController;
  lastUsed: number;
  warmupPromise?: Promise<void>;
}>();

// Response cache for instant repeat queries
const RESPONSE_CACHE = new Map<string, {
  response: string;
  timestamp: number;
  ttl: number;
}>();

// Cleanup old connections every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [url, conn] of CONNECTION_POOL.entries()) {
    if (now - conn.lastUsed > 30000) { // 30s idle timeout
      conn.controller.abort();
      CONNECTION_POOL.delete(url);
    }
  }
}, 30000);

// Ultra-fast cache check
export const getCachedResponse = (prompt: string): string | null => {
  const cacheKey = hashString(prompt);
  const cached = RESPONSE_CACHE.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log("⚡ CACHE HIT - Instant response!");
    return cached.response;
  }
  
  return null;
};

// Cache successful responses for ultra-fast repeat queries
export const cacheResponse = (prompt: string, response: string, ttlMs: number = 300000) => {
  const cacheKey = hashString(prompt);
  RESPONSE_CACHE.set(cacheKey, {
    response,
    timestamp: Date.now(),
    ttl: ttlMs
  });
  
  // Limit cache size
  if (RESPONSE_CACHE.size > 100) {
    const oldest = Array.from(RESPONSE_CACHE.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
    RESPONSE_CACHE.delete(oldest[0]);
  }
};

// Aggressive connection pre-warming
export const ultraWarmConnection = async (baseUrl: string): Promise<void> => {
  const existing = CONNECTION_POOL.get(baseUrl);
  if (existing?.warmupPromise) {
    return existing.warmupPromise;
  }

  const controller = new AbortController();
  const warmupPromise = (async () => {
    try {
      // Use HEAD request for maximum speed
      await fetch(`${baseUrl}/health`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=30, max=1000',
        },
        keepalive: true,
      });
    } catch (error) {
      // Try main endpoint if health check fails
      try {
        await fetch(baseUrl, {
          method: 'OPTIONS',
          signal: controller.signal,
          headers: { 'Connection': 'keep-alive' },
          keepalive: true,
        });
      } catch (fallbackError) {
        console.debug(`Warmup failed for ${baseUrl}`);
      }
    }
  })();

  CONNECTION_POOL.set(baseUrl, {
    controller,
    lastUsed: Date.now(),
    warmupPromise,
  });

  await warmupPromise;
};

// Ultra-fast HTTP client with extreme optimizations
export const ultraFastFetch = async (url: string, options: RequestInit): Promise<Response> => {
  const baseUrl = new URL(url).origin;
  
  // Update connection last used time
  const conn = CONNECTION_POOL.get(baseUrl);
  if (conn) {
    conn.lastUsed = Date.now();
  } else {
    // Quick connection setup if not warmed
    const controller = new AbortController();
    CONNECTION_POOL.set(baseUrl, {
      controller,
      lastUsed: Date.now(),
    });
  }

  // Ultra-aggressive timeout and options
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s absolute max

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30, max=1000',
        'Accept-Encoding': 'gzip, deflate', // Enable compression for speed
        'Cache-Control': 'no-cache', // Prevent stale responses
      },
      keepalive: true,
      // @ts-ignore - Tauri-specific optimizations
      priority: 'high',
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Minimal hash function for caching
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

// Preload critical API endpoints
export const preloadCriticalEndpoints = async () => {
  const critical = [
    "https://api.openai.com",
    "https://api.groq.com", 
    "https://api.anthropic.com",
    "https://generativelanguage.googleapis.com",
  ];

  console.log("🚀 Pre-loading critical API endpoints for sub-800ms performance...");
  
  const promises = critical.map(url => ultraWarmConnection(url).catch(() => {}));
  await Promise.allSettled(promises);
  
  console.log("🚀 Critical endpoints preloaded!");
};

// Voice-optimized parameters for maximum speed
export const getVoiceOptimizedParams = (provider: string) => {
  const params: any = {
    temperature: 0.01,    // Maximum determinism
    top_p: 0.2,          // Extreme focus
    max_tokens: 30,      // Ultra-brief for voice
    stream: true,        // Immediate response start
  };

  // Provider-specific ultra-optimizations
  switch (provider) {
    case "openai":
    case "groq":
      params.presence_penalty = 0.3;
      params.frequency_penalty = 0.2;
      params.logit_bias = { "13": -100 }; // Discourage verbose words
      break;
    case "claude":
      params.top_k = 1; // Maximum focus
      break;
  }

  return params;
};