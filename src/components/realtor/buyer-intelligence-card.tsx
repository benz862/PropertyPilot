import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIntentLabel } from "@/lib/buyer-intelligence";
import type { BuyerIntelligenceReport } from "@/lib/buyer-intelligence";

interface BuyerIntelligenceCardProps {
  report: BuyerIntelligenceReport;
  buyerName?: string | null;
}

export function BuyerIntelligenceCard({ report, buyerName }: BuyerIntelligenceCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">
            {buyerName ?? (report.isAnonymous ? "Anonymous Visitor" : "Buyer")}
          </CardTitle>
          <Badge variant="secondary">{formatIntentLabel(report.intentLevel)}</Badge>
          <Badge variant="outline">Score {report.intentScore}</Badge>
          <Badge variant="outline" className="capitalize">{report.sentiment}</Badge>
        </div>
        <CardDescription>
          {report.sessionInfo.durationMinutes
            ? `${report.sessionInfo.durationMinutes} min session`
            : "Active session"}
          {report.engagement.questionsAsked > 0 &&
            ` · ${report.engagement.questionsAsked} questions`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-foreground">Executive Summary</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">{report.executiveSummary}</p>
        </div>

        {report.interests.length > 0 && (
          <div>
            <p className="font-medium text-foreground">Interests</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {report.interests.map((interest) => (
                <Badge key={interest.name} variant="secondary">
                  {interest.name} ({interest.confidenceScore}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {report.concerns.length > 0 && (
          <div>
            <p className="font-medium text-foreground">Concerns</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {report.concerns.map((concern) => (
                <li key={concern.concern}>{concern.concern}</li>
              ))}
            </ul>
          </div>
        )}

        {report.followUpRecommendations.length > 0 && (
          <div>
            <p className="font-medium text-foreground">Recommended Follow-up</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {report.followUpRecommendations.slice(0, 3).map((rec) => (
                <li key={rec.action}>
                  <span className="font-medium text-foreground">{rec.action}</span>
                  {" — "}
                  {rec.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.suggestedTalkingPoints.length > 0 && (
          <div>
            <p className="font-medium text-foreground">Talking Points</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {report.suggestedTalkingPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
