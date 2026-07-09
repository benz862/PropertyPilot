import { describe, expect, it } from "vitest";

import {
  createAutosaveState,
  evaluateVoiceQuality,
  shouldSegmentRecording,
} from "./service";

describe("voice capture service", () => {
  it("creates recoverable autosave state", () => {
    const state = createAutosaveState({
      recordingId: "rec_1",
      propertyId: "prop_1",
      status: "recording",
      elapsedSeconds: 12,
    });

    expect(state).toMatchObject({
      recordingId: "rec_1",
      propertyId: "prop_1",
      status: "recording",
      elapsedSeconds: 12,
      unsyncedSegmentCount: 0,
    });
  });

  it("segments by duration or size", () => {
    expect(shouldSegmentRecording({ elapsedSeconds: 300, currentSegmentBytes: 1 })).toBe(true);
    expect(shouldSegmentRecording({ elapsedSeconds: 1, currentSegmentBytes: 100 * 1024 * 1024 })).toBe(true);
    expect(shouldSegmentRecording({ elapsedSeconds: 10, currentSegmentBytes: 1 })).toBe(false);
  });

  it("reports audio quality warnings", () => {
    const report = evaluateVoiceQuality({
      peakAmplitude: 0.99,
      averageAmplitude: 0.005,
      noiseFloor: 0.25,
      durationSeconds: 20,
    });

    expect(report.clippedAudio).toBe(true);
    expect(report.silentRecording).toBe(true);
    expect(report.excessiveNoise).toBe(true);
    expect(report.warnings).toHaveLength(3);
  });
});
