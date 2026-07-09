import Link from "next/link";
import { FileText, ImageIcon, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buyerRoutes } from "@/lib/navigation/routes";

interface OfflineFallbackProps {
  slug: string;
  agentName: string;
  message?: string;
}

export function OfflineFallback({
  slug,
  agentName,
  message = "Voice assistance is temporarily unavailable, but you can still explore this property.",
}: OfflineFallbackProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="text-base text-amber-900">Property information available</CardTitle>
        <CardDescription className="text-amber-800">{message}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href={`${buyerRoutes.welcome(slug)}#photos`}>
            <ImageIcon className="size-4" aria-hidden />
            View Photos
          </Link>
        </Button>
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href={buyerRoutes.lead(slug)}>
            <FileText className="size-4" aria-hidden />
            Request Property Guide
          </Link>
        </Button>
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href={buyerRoutes.lead(slug)}>
            <Phone className="size-4" aria-hidden />
            Contact {agentName}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
