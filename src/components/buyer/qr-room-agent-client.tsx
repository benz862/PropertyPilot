"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Mic, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PublicPropertyPayload } from "@/lib/public-room-agent/service";

interface QrRoomAgentClientProps {
  property: PublicPropertyPayload;
}

interface AskResponse {
  answer: string;
  confidence: "high" | "medium" | "low";
  needsAgentFollowup: boolean;
  answeredFromSources: Array<{ source: string; excerpt: string }>;
  questionId: string | null;
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
}

async function trackBuyerEvent(
  slug: string,
  sessionId: string,
  type: "page_open" | "room_selected" | "session_started" | "session_ended",
  room: string,
) {
  try {
    await fetch(`/api/public/properties/${slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, room, sessionId }),
    });
  } catch {
    // analytics must never block the buyer
  }
}

export function QrRoomAgentClient({ property }: QrRoomAgentClientProps) {
  const sessionId = useRef(createSessionId());
  const [selectedRoomKey, setSelectedRoomKey] = useState(
    roomKey(property.rooms[0]?.id ?? null, property.rooms[0]?.name ?? "Whole Property"),
  );
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSaved, setLeadSaved] = useState(false);

  const selectedRoom = useMemo(() => {
    const [id, name] = selectedRoomKey.split("::");
    return {
      id: id === "none" ? null : id,
      name: name || "Whole Property",
    };
  }, [selectedRoomKey]);

  useEffect(() => {
    const session = sessionId.current;
    void trackBuyerEvent(property.slug, session, "page_open", selectedRoom.name);
    void trackBuyerEvent(property.slug, session, "session_started", selectedRoom.name);

    return () => {
      void trackBuyerEvent(property.slug, session, "session_ended", selectedRoom.name);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session lifecycle once per property visit
  }, [property.slug]);

  useEffect(() => {
    void trackBuyerEvent(property.slug, sessionId.current, "room_selected", selectedRoom.name);
  }, [property.slug, selectedRoom.name]);

  async function ask(inputType: "voice" | "text", overrideQuestion?: string) {
    const text = (overrideQuestion ?? question).trim();
    if (!text || loading) return;

    setLoading(true);
    setLeadSaved(false);
    try {
      const response = await fetch(`/api/public/properties/${property.slug}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          selectedRoom: selectedRoom.name,
          question: text,
          inputType,
        }),
      });
      const body = (await response.json()) as { data: AskResponse | null; error?: string | null };
      if (!response.ok || body.error || !body.data) {
        throw new Error(body.error ?? "Question failed");
      }
      setAnswer(body.data);
      setQuestion("");
    } catch (error) {
      setAnswer({
        answer: error instanceof Error ? error.message : "I could not answer that right now.",
        confidence: "low",
        needsAgentFollowup: true,
        answeredFromSources: [],
        questionId: null,
      });
    } finally {
      setLoading(false);
    }
  }

  function startVoice() {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAnswer({
        answer: "Voice input is not available in this browser. You can type your question instead.",
        confidence: "low",
        needsAgentFollowup: false,
        answeredFromSources: [],
        questionId: null,
      });
      return;
    }

    const recognition = new SpeechRecognition() as SpeechRecognitionLike;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuestion(transcript);
      void ask("voice", transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  async function submitLead() {
    if (!answer?.needsAgentFollowup || !leadName.trim() || !leadEmail.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/public/properties/${property.slug}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: answer.questionId,
          buyerName: leadName,
          buyerEmail: leadEmail,
          buyerPhone: leadPhone || null,
        }),
      });
      if (!response.ok) throw new Error("Lead capture failed");
      setLeadSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background pb-12">
      <section className="relative min-h-[42vh] bg-secondary">
        {property.heroImageUrl ? (
          <Image
            src={property.heroImageUrl}
            alt={property.address}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="flex min-h-[42vh] items-center justify-center px-6 text-center text-muted-foreground">
            {property.address}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </section>

      <section className="relative -mt-20 mx-auto max-w-2xl px-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
          <p className="text-sm font-medium text-muted-foreground">{property.agentName ?? "Listing Agent"}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-normal">{property.address}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{property.summary}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="Price" value={property.price ? `$${property.price.toLocaleString()}` : "Ask agent"} />
            <Stat label="Beds" value={property.beds?.toString() ?? "-"} />
            <Stat label="Baths" value={property.baths?.toString() ?? "-"} />
            <Stat label="Sq Ft" value={property.squareFeet?.toLocaleString() ?? "-"} />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Ask a question about this home</h2>
          <div className="mt-4 space-y-2">
            <Label htmlFor="room">Room</Label>
            <Select value={selectedRoomKey} onValueChange={setSelectedRoomKey}>
              <SelectTrigger id="room">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {property.rooms.map((room) => (
                  <SelectItem key={roomKey(room.id, room.name)} value={roomKey(room.id, room.name)}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void ask("text");
            }}
          >
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              placeholder="How old is the roof? What appliances are included?"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={startVoice} disabled={loading || listening}>
                <Mic className="size-4" aria-hidden />
                {listening ? "Listening" : "Ask by Voice"}
              </Button>
              <Button type="submit" disabled={!question.trim() || loading}>
                <Send className="size-4" aria-hidden />
                Ask
              </Button>
            </div>
          </form>

          {answer && (
            <div className="mt-5 space-y-4">
              <Alert variant={answer.needsAgentFollowup ? "warning" : "success"} title="Answer">
                <p>{loading ? "One moment..." : answer.answer}</p>
              </Alert>
              {answer.answeredFromSources.length > 0 && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  {answer.answeredFromSources.map((source) => (
                    <p key={`${source.source}-${source.excerpt}`}>
                      <span className="font-medium text-foreground">{source.source}:</span> {source.excerpt}
                    </p>
                  ))}
                </div>
              )}
              {answer.needsAgentFollowup && (
                <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-sm font-medium">Send this to the listing agent</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={leadName} onChange={(event) => setLeadName(event.target.value)} placeholder="Name" />
                    <Input value={leadEmail} onChange={(event) => setLeadEmail(event.target.value)} placeholder="Email" type="email" />
                  </div>
                  <Input value={leadPhone} onChange={(event) => setLeadPhone(event.target.value)} placeholder="Phone optional" />
                  <Button type="button" onClick={submitLead} disabled={loading || !leadName.trim() || !leadEmail.trim()}>
                    Send to Agent
                  </Button>
                  {leadSaved && <p className="text-sm text-muted-foreground">Sent to the listing agent.</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          PropertyPilot provides AI-generated answers based on information supplied for this property. Details should be
          verified with the listing agent, disclosures, inspections, MLS data, and official records before making
          decisions.
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function roomKey(id: string | null, name: string): string {
  return `${id ?? "none"}::${name}`;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => unknown;
    webkitSpeechRecognition?: new () => unknown;
  }
}
