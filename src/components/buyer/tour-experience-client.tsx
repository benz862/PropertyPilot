"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { AccessibilityControls } from "@/components/buyer/accessibility-controls";
import { BuyerAssistance } from "@/components/buyer/buyer-assistance";
import { OfflineFallback } from "@/components/buyer/offline-fallback";
import { PhotoGallery } from "@/components/buyer/photo-gallery";
import { PropertySidebar, PropertySidebarTrigger } from "@/components/buyer/property-sidebar";
import { VoiceControls } from "@/components/buyer/voice-controls";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buyerRoutes } from "@/lib/navigation/routes";
import type { BuyerProfileMemory } from "@/lib/ai/conversation/buyer-profile";
import type { ConversationMemoryState } from "@/lib/ai/types";
import type { PropertyTwinContext } from "@/types/database";

type SpeechRecognitionLike = {
  stop: () => void;
};

interface TourPhoto {
  id: string;
  url: string | null;
  caption: string | null;
}

interface TourExperienceClientProps {
  slug: string;
  propertyId: string;
  agentName: string;
  agentPhone?: string | null;
  agentEmail?: string | null;
  areaTitle: string;
  welcomePrompt: string;
  poiId?: string;
  context: PropertyTwinContext;
  photos: TourPhoto[];
}

export function TourExperienceClient({
  slug,
  propertyId,
  agentName,
  agentPhone,
  agentEmail,
  areaTitle,
  welcomePrompt,
  poiId,
  context,
  photos,
}: TourExperienceClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [spokenAnswer, setSpokenAnswer] = useState(welcomePrompt);
  const [liveSuggestion, setLiveSuggestion] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sessionToken] = useState(() => crypto.randomUUID());
  const [visitorSessionId, setVisitorSessionId] = useState<string | null>(null);
  const [memory, setMemory] = useState<ConversationMemoryState | undefined>();
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfileMemory | undefined>();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [lastAudio, setLastAudio] = useState<{ base64: string; mimeType: string } | null>(null);
  const recognitionRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function initSession() {
      try {
        const response = await fetch("/api/tour/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId,
            sessionToken,
            currentPoiId: poiId ?? null,
            language: navigator.language?.slice(0, 2) ?? "en",
          }),
        });
        const result = (await response.json()) as { data: { id: string } | null };
        if (result.data?.id) {
          setVisitorSessionId(result.data.id);
          await fetch("/api/buyer-intelligence/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              propertyId,
              visitorSessionId: result.data.id,
              eventType: "poi_viewed",
              poiId: poiId ?? null,
              eventData: { area: areaTitle },
            }),
          });
        }
      } catch {
        // Session tracking is best-effort; tour continues without it.
      }
    }
    void initSession();
  }, [areaTitle, poiId, propertyId, sessionToken]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const activeSessionId = visitorSessionId ?? sessionToken;

  const sendMessage = useCallback(
    async (message: string, interrupted = false) => {
      if (!message.trim() || isProcessing) return;

      setIsProcessing(true);
      setLiveSuggestion(null);
      setHasInteracted(true);

      try {
        const formData = new FormData();
        formData.append("propertyId", propertyId);
        formData.append("visitorSessionId", activeSessionId);
        formData.append("currentPoiId", poiId ?? "");
        formData.append("message", message.trim());
        formData.append("interrupted", String(interrupted));
        formData.append("transcriptOnly", "false");
        const response = await fetch("/api/ai/voice/audio", {
          method: "POST",
          body: formData,
        });

        const result = (await response.json()) as {
          data: {
            spokenAnswer: string;
            offline: boolean;
            roomTransition?: string;
            profileRecommendation?: string;
            memory?: ConversationMemoryState;
            buyerProfile?: BuyerProfileMemory;
            audioBase64?: string | null;
            audioMimeType?: string | null;
          } | null;
          error?: string | null;
        };

        if (!response.ok || result.error || !result.data) {
          throw new Error(result.error ?? "Voice audio request failed");
        }

        if (result.data) {
          setSpokenAnswer(result.data.spokenAnswer);
          setOffline(result.data.offline);
          const suggestion = result.data.roomTransition ?? result.data.profileRecommendation ?? null;
          setLiveSuggestion(suggestion);
          if (result.data.memory) setMemory(result.data.memory);
          if (result.data.buyerProfile) setBuyerProfile(result.data.buyerProfile);
          if (result.data.audioBase64 && result.data.audioMimeType) {
            setLastAudio({ base64: result.data.audioBase64, mimeType: result.data.audioMimeType });
          }
          await playReturnedAudio(result.data.audioBase64 ?? null, result.data.audioMimeType ?? null);
        }
      } catch {
        setOffline(true);
        setSpokenAnswer(
          `I'm having trouble connecting right now, but you can still browse property photos and contact ${agentName}.`,
        );
      } finally {
        setIsProcessing(false);
        setInputMessage("");
      }
    },
    [activeSessionId, buyerProfile, isProcessing, memory, poiId, propertyId, agentName],
  );

  async function playReturnedAudio(audioBase64: string | null, mimeType: string | null) {
    if (!audioBase64 || !mimeType || isMuted) return;
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const player = audioPlayerRef.current ?? new Audio();
    audioPlayerRef.current = player;
    player.pause();
    player.src = url;
    await player.play().catch(() => undefined);
    player.onended = () => URL.revokeObjectURL(url);
  }

  async function submitRecordedAudio(audioBlob: Blob) {
    setIsProcessing(true);
    setLiveSuggestion(null);
    setHasInteracted(true);

    try {
      const formData = new FormData();
      formData.append("propertyId", propertyId);
      formData.append("visitorSessionId", activeSessionId);
      formData.append("currentPoiId", poiId ?? "");
      formData.append("audio", audioBlob, "voice.webm");

      const response = await fetch("/api/ai/voice/audio", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        data: {
          spokenAnswer: string;
          offline: boolean;
          roomTransition?: string;
          profileRecommendation?: string;
          memory?: ConversationMemoryState;
          buyerProfile?: BuyerProfileMemory;
          audioBase64?: string | null;
          audioMimeType?: string | null;
          transcript?: string;
        } | null;
        error?: string | null;
      };

      if (!response.ok || result.error || !result.data) {
        throw new Error(result.error ?? "Voice audio request failed");
      }

      setSpokenAnswer(result.data.spokenAnswer);
      setOffline(result.data.offline);
      const suggestion = result.data.roomTransition ?? result.data.profileRecommendation ?? null;
      setLiveSuggestion(suggestion);
      if (result.data.memory) setMemory(result.data.memory);
      if (result.data.buyerProfile) setBuyerProfile(result.data.buyerProfile);
      if (result.data.audioBase64 && result.data.audioMimeType) {
        setLastAudio({ base64: result.data.audioBase64, mimeType: result.data.audioMimeType });
      }
      await playReturnedAudio(result.data.audioBase64 ?? null, result.data.audioMimeType ?? null);
    } catch {
      setOffline(true);
      setSpokenAnswer(
        `I'm having trouble connecting right now, but you can still browse property photos and contact ${agentName}.`,
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleToggleListen() {
    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setOffline(true);
      setSpokenAnswer(
        `Voice recording is not available in this browser. You can still type a question or browse the photos and details.`,
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setIsListening(false);
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        void submitRecordedAudio(blob);
      };
      recognitionRef.current = recorder;
      setIsListening(true);
      recorder.start();
    } catch {
      setOffline(true);
      setSpokenAnswer(
        `I could not access the microphone. You can still type a question or browse the photos and details.`,
      );
    }
  }

  function handleSaveProperty() {
    try {
      const saved = JSON.parse(localStorage.getItem("propertypilot-saved") ?? "[]") as string[];
      if (!saved.includes(slug)) {
        localStorage.setItem("propertypilot-saved", JSON.stringify([...saved, slug]));
      }
      setSaved(true);
    } catch {
      setSaved(true);
    }
  }

  const showLeadPrompt = hasInteracted && !offline;

  return (
    <div className="min-h-screen bg-background pb-44">
      <div className="fixed left-4 top-4 z-30">
        <AccessibilityControls />
      </div>
      <PropertySidebarTrigger onClick={() => setSidebarOpen(true)} />
      <PropertySidebar
        slug={slug}
        agentName={agentName}
        agentPhone={agentPhone}
        agentEmail={agentEmail}
        context={context}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm font-medium uppercase tracking-normal text-muted-foreground">
          {areaTitle}
        </p>

        <div
          className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
          role="region"
          aria-label="AI guide response"
          aria-live="polite"
        >
          <p className="buyer-response text-lg leading-relaxed text-foreground">
            {isProcessing ? "One moment..." : spokenAnswer}
          </p>
          {liveSuggestion && (
            <p className="buyer-response mt-4 rounded-lg bg-secondary/60 p-3 text-sm italic text-muted-foreground">
              {liveSuggestion}
            </p>
          )}
        </div>

        {offline && (
          <div className="mt-6">
            <OfflineFallback slug={slug} agentName={agentName} />
          </div>
        )}

        <section id="photos" className="mt-8">
          <h2 className="text-base font-semibold text-foreground">Photos</h2>
          <div className="mt-3">
            <PhotoGallery photos={photos} />
          </div>
        </section>

        <section id="details" className="mt-8">
          <BuyerAssistance
            slug={slug}
            agentPhone={agentPhone}
            agentEmail={agentEmail}
            onSave={handleSaveProperty}
            saved={saved}
          />
        </section>

        {showLeadPrompt && (
          <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              I can email you the complete property guide if you&apos;d like.
            </p>
            <Button variant="link" className="mt-1" asChild>
              <Link href={buyerRoutes.lead(slug)}>Yes, send me the guide</Link>
            </Button>
          </div>
        )}

        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(inputMessage);
          }}
        >
          <label htmlFor="buyer-question" className="sr-only">
            Ask a question
          </label>
          <Textarea
            id="buyer-question"
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            placeholder="Ask about this area..."
            rows={2}
            className="min-h-12 resize-none"
          />
          <Button type="submit" className="min-h-11" disabled={!inputMessage.trim() || isProcessing}>
            Ask
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Tap the microphone when you&apos;re ready to speak.
        </p>
      </main>

      <VoiceControls
        slug={slug}
        isListening={isListening}
        isMuted={isMuted}
        onToggleListen={handleToggleListen}
        onToggleMute={() => setIsMuted((value) => !value)}
        onReplay={() => {
          if (lastAudio) {
            void playReturnedAudio(lastAudio.base64, lastAudio.mimeType);
          }
        }}
      />
    </div>
  );
}
