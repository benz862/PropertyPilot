import {
  EXPECTED_ROOM_COVERAGE,
  type PhotoCoverageEntry,
  type PhotoCoverageMap,
} from "@/lib/property-builder/types";

interface PhotoInput {
  detectedRoom: string | null;
  tags: string[];
}

export function calculatePhotoCoverage(photos: PhotoInput[]): PhotoCoverageMap {
  const entries: PhotoCoverageEntry[] = EXPECTED_ROOM_COVERAGE.map((room) => {
    const matching = photos.filter((photo) => matchesRoom(photo, room));
    const photoCount = matching.length;
    const coveragePercent = photoCount === 0 ? 0 : Math.min(100, photoCount * 35);
    return { room, coveragePercent, photoCount };
  });

  const missingRooms = entries
    .filter((entry) => entry.photoCount === 0)
    .map((entry) => entry.room);

  const overallCoverage =
    entries.length === 0
      ? 0
      : Math.round(
          entries.reduce((sum, entry) => sum + entry.coveragePercent, 0) / entries.length,
        );

  return {
    entries,
    missingRooms,
    overallCoverage,
  };
}

export function getMissingCoverageSuggestions(missingRooms: string[]): string[] {
  return missingRooms.map(
    (room) => `We do not yet have any photos of the ${room}.`,
  );
}

function matchesRoom(photo: PhotoInput, room: string): boolean {
  const normalizedRoom = room.toLowerCase();
  const detected = photo.detectedRoom?.toLowerCase() ?? "";
  if (detected.includes(normalizedRoom) || normalizedRoom.includes(detected)) {
    return true;
  }
  return photo.tags.some((tag) => {
    const normalizedTag = tag.toLowerCase();
    return normalizedTag.includes(normalizedRoom) || normalizedRoom.includes(normalizedTag);
  });
}
