import { APP_LIMITS, TIME } from "@/lib/constants";

import type {
  VoiceCaptureAutosaveState,
  VoiceCaptureSettings,
  VoiceQualityReport,
  VoiceRecordingStatus,
} from "./types";

export const DEFAULT_VOICE_CAPTURE_SETTINGS: VoiceCaptureSettings = {
  sampleRateHz: 48_000,
  channelCount: 1,
  preferredMimeType: "audio/aac",
  maxRecordingMinutes: 60,
  segmentMinutes: 5,
  maxSegmentBytes: 100 * 1024 * 1024,
  autosaveIntervalMs: 5 * TIME.secondMs,
};

export function createAutosaveState(input: {
  recordingId: string;
  propertyId: string;
  assetId?: string | null;
  status?: VoiceRecordingStatus;
  elapsedSeconds?: number;
  unsyncedSegmentCount?: number;
}): VoiceCaptureAutosaveState {
  return {
    recordingId: input.recordingId,
    propertyId: input.propertyId,
    assetId: input.assetId ?? null,
    status: input.status ?? "draft",
    elapsedSeconds: input.elapsedSeconds ?? 0,
    unsyncedSegmentCount: input.unsyncedSegmentCount ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

export function shouldSegmentRecording(input: {
  elapsedSeconds: number;
  currentSegmentBytes: number;
  settings?: VoiceCaptureSettings;
}): boolean {
  const settings = input.settings ?? DEFAULT_VOICE_CAPTURE_SETTINGS;
  return (
    input.elapsedSeconds >= settings.segmentMinutes * 60 ||
    input.currentSegmentBytes >= settings.maxSegmentBytes
  );
}

export function evaluateVoiceQuality(input: {
  peakAmplitude: number;
  averageAmplitude: number;
  noiseFloor: number;
  durationSeconds: number;
}): VoiceQualityReport {
  const clippedAudio = input.peakAmplitude >= 0.98;
  const silentRecording = input.durationSeconds > 3 && input.averageAmplitude < 0.01;
  const excessiveNoise = input.noiseFloor > 0.2;

  const warnings = [
    clippedAudio ? "Audio may be clipped. Move farther from the microphone." : null,
    silentRecording ? "Recording appears silent." : null,
    excessiveNoise ? "Background noise may reduce transcription quality." : null,
  ].filter((warning): warning is string => Boolean(warning));

  return {
    clippedAudio,
    silentRecording,
    excessiveNoise,
    warnings,
  };
}

export function getVoiceStartupTargetMs(): number {
  return Math.min(250, APP_LIMITS.workspaceSearchDebounceMs);
}
