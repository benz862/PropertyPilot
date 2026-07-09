import { createKnowledgeEngineService } from "@/lib/knowledge-engine";
import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { createPropertyTwinService } from "@/lib/property-twin/service";

import type {
  ExecutiveSummary,
  IntelligenceDashboard,
  IntelligenceRecommendation,
  PropertyScorecard,
} from "./types";

function trendFromDelta(current: number, previous: number): "up" | "down" | "stable" {
  if (current > previous + 2) return "up";
  if (current < previous - 2) return "down";
  return "stable";
}

/**
 * Intelligence Center (PRD-017) — actionable recommendations from activity + twin data.
 */
export class IntelligenceCenterService {
  async getDashboard(userId: string): Promise<IntelligenceDashboard> {
    void userId;

    const workspace = await loadWorkspaceDashboard();
    const twin = await createPropertyTwinService();
    const knowledge = await createKnowledgeEngineService();

    const scorecards: PropertyScorecard[] = [];
    const recommendations: IntelligenceRecommendation[] = [];

    for (const property of workspace.properties.slice(0, 10)) {
      const health = await knowledge.getHealth(property.id);
      const snapshot = await twin.getTwinSnapshot(property.id);
      const overall = health?.overall ?? 0;

      scorecards.push({
        propertyId: property.id,
        address: property.address,
        overallScore: overall,
        previousScore: Math.max(0, overall - 5),
        trend: trendFromDelta(overall, overall - 5),
        buyerExperience: workspace.analytics.tourStarts > 0 ? 70 : 40,
        knowledgeQuality: health?.verificationScore ?? 0,
        photoQuality: health?.photoCoverage ?? 0,
        marketingQuality: snapshot?.documents.length ? 60 : 30,
        voiceExperience: snapshot?.pois.length ? 75 : 40,
        leadConversion:
          workspace.analytics.tourStarts > 0
            ? Math.round(
                (workspace.analytics.leadsCaptured / workspace.analytics.tourStarts) * 100,
              )
            : 0,
        conversationQuality: 65,
        verification: health?.verificationScore ?? 0,
        publishingReadiness: property.status === "published" ? 90 : 50,
        recommendation:
          overall < 60
            ? "Add verified knowledge and photos before promoting."
            : "Monitor buyer questions and refresh marketing assets.",
      });

      if (health && health.overall < 70) {
        recommendations.push({
          id: `rec-${property.id}`,
          priority: health.overall < 50 ? "critical" : "high",
          title: `Improve knowledge for ${property.address}`,
          reason: health.missingItems.join("; ") || "Knowledge score below target",
          action: "Review knowledge gaps and upload supporting documents",
          propertyId: property.id,
          evidence: health.suggestions,
        });
      }
    }

    const needingAttention = scorecards
      .filter((s) => s.overallScore < 70)
      .sort((a, b) => a.overallScore - b.overallScore);

    const topPerformers = scorecards
      .filter((s) => s.overallScore >= 70)
      .sort((a, b) => b.overallScore - a.overallScore);

    const priorities = recommendations
      .filter((r) => r.priority === "critical" || r.priority === "high")
      .slice(0, 5);

    return {
      priorities,
      recommendations,
      propertiesNeedingAttention: needingAttention,
      topPerformers,
      recentLeads: workspace.analytics.leadsCaptured,
      healthChanges: needingAttention.length,
    };
  }

  async getExecutiveSummary(userId: string): Promise<ExecutiveSummary> {
    void userId;

    const workspace = await loadWorkspaceDashboard();
    const tours = workspace.analytics.tourStarts;
    const leads = workspace.analytics.leadsCaptured;

    const narrative = [
      tours > 0
        ? `You had ${tours} buyer tour${tours === 1 ? "" : "s"} recently.`
        : "No buyer tours recorded yet this period.",
      leads > 0 ? `${leads} visitor${leads === 1 ? "" : "s"} became leads.` : "",
      workspace.properties.length > 0
        ? `${workspace.properties.filter((p) => p.status !== "published").length} listings still in draft.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      date: new Date().toISOString().slice(0, 10),
      tourCount: tours,
      brochureRequests: Math.floor(leads * 0.4),
      showingRequests: Math.floor(leads * 0.3),
      topTopics: ["HVAC", "Workshop", "Kitchen"],
      listingsNeedingAttention: workspace.properties
        .filter((p) => p.status === "draft")
        .slice(0, 3)
        .map((p) => p.address),
      estimatedReadMinutes: 1,
      narrative,
    };
  }

  async getPropertyScorecard(propertyId: string): Promise<PropertyScorecard | null> {
    const dashboard = await this.getDashboard("system");
    return (
      dashboard.propertiesNeedingAttention.find((s) => s.propertyId === propertyId) ??
      dashboard.topPerformers.find((s) => s.propertyId === propertyId) ??
      null
    );
  }
}

export async function createIntelligenceCenterService(): Promise<IntelligenceCenterService> {
  return new IntelligenceCenterService();
}
