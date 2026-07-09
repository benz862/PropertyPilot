export type VoiceRecordingStatus =
  | "draft"
  | "recording"
  | "paused"
  | "uploading"
  | "uploaded"
  | "processing"
  | "ready_for_review"
  | "approved"
  | "failed"
  | "canceled";

export interface VoiceCaptureSettings {
  sampleRateHz: number;
  channelCount: number;
  preferredMimeType: string;
  maxRecordingMinutes: number;
  segmentMinutes: number;
  maxSegmentBytes: number;
  autosaveIntervalMs: number;
}

export interface VoiceCaptureAutosaveState {
  recordingId: string;
  propertyId: string;
  assetId: string | null;
  status: VoiceRecordingStatus;
  elapsedSeconds: number;
  unsyncedSegmentCount: number;
  updatedAt: string;
}

export interface VoiceQualityReport {
  clippedAudio: boolean;
  silentRecording: boolean;
  excessiveNoise: boolean;
  warnings: string[];
}
