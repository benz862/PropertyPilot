import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BuyerActivitySummary } from "@/lib/property-dna/buyer-activity";
import type { Fact, PropertyDNA, PropertyDNARoom } from "@/lib/property-dna/types";

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function FactRow({ fact }: { fact: Fact }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{fact.label}</span>
        <Badge variant="outline" className="capitalize">
          {fact.confidence}
        </Badge>
      </div>
      <p className="mt-1 text-muted-foreground">{fact.value}</p>
    </div>
  );
}

export function PropertyDNASection({ dna }: { dna: PropertyDNA }) {
  const systemFacts = Object.values(dna.systems).filter((fact): fact is Fact => Boolean(fact));
  const exteriorFacts = [
    ...dna.exterior.features,
    ...dna.exterior.lotFeatures,
    dna.exterior.garage,
    dna.exterior.pool,
    dna.exterior.patioDeck,
    dna.exterior.landscaping,
  ].filter((fact): fact is Fact => Boolean(fact));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Property DNA</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The single source of truth. Every engine reads from this object.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreCard label="Knowledge Score" value={dna.health.knowledgeScore} />
        <ScoreCard label="Marketing Score" value={dna.health.marketingScore} />
        <ScoreCard label="Buyer Readiness" value={dna.health.buyerReadinessScore} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basics</CardTitle>
          <CardDescription>{dna.basic.address}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Price" value={dna.basic.price != null ? `$${dna.basic.price.toLocaleString()}` : "—"} />
          <Detail label="Beds" value={dna.basic.beds ?? "—"} />
          <Detail label="Baths" value={dna.basic.baths ?? "—"} />
          <Detail label="Square Feet" value={dna.basic.squareFeet?.toLocaleString() ?? "—"} />
          <Detail label="Year Built" value={dna.basic.yearBuilt ?? "—"} />
          <Detail label="Type" value={dna.basic.propertyType ?? "—"} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Systems</CardTitle>
            <CardDescription>Derived from documents, voice notes, and knowledge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemFacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No system details captured yet.</p>
            ) : (
              systemFacts.map((fact) => <FactRow key={`${fact.label}-${fact.value}`} fact={fact} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exterior & Lot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {exteriorFacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exterior details captured yet.</p>
            ) : (
              exteriorFacts.slice(0, 8).map((fact, index) => <FactRow key={`${fact.label}-${index}`} fact={fact} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Neighborhood</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[...dna.neighborhood.schools, ...dna.neighborhood.notes].length === 0 ? (
              <p className="text-sm text-muted-foreground">No neighborhood notes yet.</p>
            ) : (
              [...dna.neighborhood.schools, ...dna.neighborhood.notes].slice(0, 10).map((fact, index) => (
                <Badge key={index} variant="secondary">
                  {fact.value}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missing Information</CardTitle>
            <CardDescription>What to add next to strengthen answers</CardDescription>
          </CardHeader>
          <CardContent>
            {dna.health.missingInformation.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {dna.health.missingInformation.slice(0, 10).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between rounded-lg bg-secondary/40 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}

export function RoomsSection({ rooms }: { rooms: PropertyDNARoom[] }) {
  const withKnowledge = rooms.filter((room) => room.id !== null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rooms</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Room-specific knowledge powers the QR room agent · {withKnowledge.length} with details
        </p>
      </div>

      {rooms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Add room knowledge in the wizard so buyers get grounded, room-specific answers.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id ?? room.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{room.name}</CardTitle>
                  <Badge variant={room.id ? "default" : "outline"}>{room.id ? "Detailed" : "Default"}</Badge>
                </div>
                {room.description && <CardDescription>{room.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <RoomList label="Features" items={room.features} />
                <RoomList label="Upgrades" items={room.upgrades} />
                <RoomList label="Included" items={room.includedItems} />
                <RoomList label="Talking Points" items={room.buyerTalkingPoints} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="list-inside list-disc text-muted-foreground">
        {items.slice(0, 5).map((item, index) => (
          <li key={`${label}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

interface ActivityQuestion {
  id: string;
  question: string;
  selected_room: string | null;
  confidence: string | null;
  needs_agent_followup: boolean;
  buyer_name: string | null;
  buyer_email: string | null;
  created_at: string;
}

export function BuyerActivitySection({
  summary,
  questions,
}: {
  summary: BuyerActivitySummary;
  questions: ActivityQuestion[];
}) {
  const topRooms = Object.entries(summary.roomSelections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buyer Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Scans, questions, and leads captured from the QR tour</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label="Scans / Opens" value={summary.scans} />
        <ScoreCard label="Questions" value={summary.questions} />
        <ScoreCard label="Unanswered" value={summary.unknownQuestions} />
        <ScoreCard label="Leads" value={summary.leads} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Viewed Rooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topRooms.length === 0 ? (
              <p className="text-muted-foreground">No room selections yet.</p>
            ) : (
              topRooms.map(([room, count]) => (
                <div key={room} className="flex justify-between">
                  <span>{room}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No buyer questions logged yet.</p>
            ) : (
              questions.slice(0, 10).map((question) => (
                <div key={question.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{question.question}</span>
                    {question.needs_agent_followup ? (
                      <Badge variant="default">Follow-up</Badge>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {question.confidence ?? "answered"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {question.selected_room ?? "Whole Property"} · {new Date(question.created_at).toLocaleString()}
                    {question.buyer_name ? ` · ${question.buyer_name}` : ""}
                    {question.buyer_email ? ` · ${question.buyer_email}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
