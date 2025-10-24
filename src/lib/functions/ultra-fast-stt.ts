// ULTRA-EXTREME SPEECH-TO-TEXT OPTIMIZATION for sub-800ms total time
// This module implements aggressive audio processing, compression, and provider selection

import { ultraFastFetch } from "./ultra-fast-api";
import { TYPE_STT_PROVIDER } from "@/types/stt.types";
import { getAuthHeaders, blobToBase64 } from "./common.function";

// Speed-prioritized provider ranking
const SPEED_RANKINGS = {
  "groq-whisper": 1,      // Fastest
  "openai-whisper": 2,    // Fast
  "assemblyai-stt": 3,    // Medium
  "deepgram-stt": 4,      // Slower
} as const;

// Ultra-compressed audio processing
export const ultraCompressAudio = (audioBuffer: Float32Array, sampleRate: number): Blob => {
  console.log(`🎤 ULTRA-COMPRESS: Processing ${audioBuffer.length} samples at ${sampleRate}Hz`);
  
  // EXTREME compression: Drop to 8kHz mono for maximum speed
  const targetRate = 8000;
  const downsampled = downsampleTo8kHz(audioBuffer, sampleRate);
  
  // Ultra-aggressive noise reduction
  const denoised = ultraAggressiveNoise(downsampled);
  
  // Minimal WAV for fastest upload
  return createMinimalWav(denoised, targetRate);
};

// Downsample to 8kHz for ultra-fast processing
const downsampleTo8kHz = (buffer: Float32Array, fromRate: number): Float32Array => {
  const ratio = Math.round(fromRate / 8000);
  const newLength = Math.ceil(buffer.length / ratio);
  const result = new Float32Array(newLength);
  
  let sampleIndex = 0;
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[sampleIndex];
    sampleIndex += ratio;
  }
  
  return result;
};

// Ultra-aggressive noise reduction
const ultraAggressiveNoise = (buffer: Float32Array): Float32Array => {
  const threshold = 0.01; // Very aggressive threshold
  
  for (let i = 0; i < buffer.length; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      buffer[i] = 0; // Silence low-amplitude noise
    }
  }
  
  return buffer;
};

// Create minimal WAV file for fastest upload
const createMinimalWav = (buffer: Float32Array, sampleRate: number): Blob => {
  const length = buffer.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

// Select fastest provider based on current performance
export const selectFastestSTTProvider = (providers: TYPE_STT_PROVIDER[]): TYPE_STT_PROVIDER | null => {
  const available = providers.filter(p => p.id in SPEED_RANKINGS);
  
  if (available.length === 0) return providers[0] || null;
  
  // Sort by speed ranking
  available.sort((a, b) => {
    const rankA = SPEED_RANKINGS[a.id as keyof typeof SPEED_RANKINGS] || 999;
    const rankB = SPEED_RANKINGS[b.id as keyof typeof SPEED_RANKINGS] || 999;
    return rankA - rankB;
  });
  
  console.log(`🚀 Selected fastest STT provider: ${available[0].id}`);
  return available[0];
};

// Ultra-fast STT with extreme optimizations
export const ultraFastSTT = async (params: {
  provider: TYPE_STT_PROVIDER;
  apiKey: string;
  audio: Blob;
}): Promise<string> => {
  const { provider, apiKey, audio } = params;
  const startTime = Date.now();
  
  console.log(`🎤 Ultra-fast STT starting with ${provider.id}...`);
  
  try {
    // Special ultra-fast handling for Groq (fastest provider)
    if (provider.id === "groq-whisper") {
      return await ultraFastGroq(provider, apiKey, audio);
    }
    
    // Use ultra-fast fetch for all others
    let url = `${provider.baseUrl}${provider.endpoint}`;
    const queryParams = new URLSearchParams(provider.request?.query as any);
    
    if ("authParam" in provider && provider.authParam) {
      queryParams.append(provider.authParam, apiKey);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const headers = {
      ...provider.request?.headers,
      ...getAuthHeaders(provider, apiKey),
    };

    const body = new FormData();
    if (provider.request?.audioKey) {
      body.append(provider.request.audioKey, audio, 'audio.wav');
    }
    
    // Add minimal fields for speed
    for (const [key, value] of Object.entries(provider.request?.fields ?? {})) {
      if (key === 'model') {
        body.append(key, 'whisper-1'); // Force fastest model
      } else {
        body.append(key, typeof value === "object" ? JSON.stringify(value) : value);
      }
    }

    const response = await ultraFastFetch(url, {
      method: provider.method || "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`STT API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.text || "";
    
    const endTime = Date.now();
    console.log(`⚡ Ultra-fast STT completed in ${endTime - startTime}ms: "${text}"`);
    
    return text;
  } catch (error) {
    console.error("Ultra-fast STT error:", error);
    throw error;
  }
};

// Ultra-optimized Groq STT (fastest provider)
const ultraFastGroq = async (
  provider: TYPE_STT_PROVIDER,
  apiKey: string,
  audio: Blob
): Promise<string> => {
  const url = "https://api.groq.com/openai/v1/audio/transcriptions";
  
  const body = new FormData();
  body.append("file", audio, "audio.wav");
  body.append("model", "whisper-large-v3"); // Groq's fastest model
  body.append("response_format", "text"); // Minimal response for speed
  body.append("temperature", "0"); // Maximum determinism
  
  const response = await ultraFastFetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Groq STT error: ${response.status}`);
  }

  return await response.text();
};