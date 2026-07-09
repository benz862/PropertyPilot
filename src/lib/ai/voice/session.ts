/**
 * Layer 1: Voice/conversation interface stub.
 * OpenAI Realtime API integration will connect here in a future PRD.
 */
export interface VoiceSessionConfig {
  voiceId: string;
  speakingSpeed: number;
  greeting: string;
}

export interface VoiceSession {
  id: string;
  config: VoiceSessionConfig;
  isActive: boolean;
}

export function createVoiceSessionConfig(
  voiceId = "alloy",
  speakingSpeed = 1.0,
  greeting = "Welcome! I'm here to help you learn about this property. What would you like to know?",
): VoiceSessionConfig {
  return { voiceId, speakingSpeed, greeting };
}

export function createVoiceSession(config: VoiceSessionConfig): VoiceSession {
  return {
    id: crypto.randomUUID(),
    config,
    isActive: false,
  };
}
