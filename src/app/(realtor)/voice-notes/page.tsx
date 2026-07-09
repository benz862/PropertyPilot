import Link from "next/link";

import { VoiceNotesSection } from "@/components/realtor/property-section-views";
import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Card, CardContent } from "@/components/ui/card";
import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { realtorRoutes } from "@/lib/navigation/routes";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  getOwnerProperties,
  getPropertyVoiceNotes,
  getWorkspaceOwnerId,
} from "@/lib/repositories/workspace-repository";
import { formatPropertyAddress } from "@/lib/realtor-workspace/types";
import type { VoiceNoteRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function VoiceNotesPage() {
  const data = await loadWorkspaceDashboard();
  const notesWithProperty: Array<VoiceNoteRow & { propertyAddress: string; propertyId: string }> = [];

  if (env.supabase.url && env.supabase.anonKey) {
    const client = await createClient();
    const ownerId = await getWorkspaceOwnerId(client);
    if (ownerId) {
      const properties = await getOwnerProperties(client, ownerId);
      for (const property of properties) {
        const notes = await getPropertyVoiceNotes(client, property.id);
        for (const note of notes) {
          notesWithProperty.push({
            ...note,
            propertyAddress: formatPropertyAddress(property),
            propertyId: property.id,
          });
        }
      }
    }
  }

  return (
    <RealtorLayoutShell
      title="Voice Notes"
      description="All recordings across your listings."
      notifications={data.notifications}
    >
      {notesWithProperty.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Record voice notes from any property workspace to capture knowledge quickly.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {notesWithProperty.map((note) => (
            <div key={note.id}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{note.propertyAddress}</p>
                <Link
                  href={realtorRoutes.propertySection(note.propertyId, "voice-notes")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open property
                </Link>
              </div>
              <VoiceNotesSection voiceNotes={[note]} />
            </div>
          ))}
        </div>
      )}
    </RealtorLayoutShell>
  );
}
