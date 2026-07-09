"use client";

import { useEffect, useState } from "react";

import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface IntegrationStatus {
  name: string;
  description: string;
  connected: boolean;
  authType?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      name: "GoHighLevel",
      description: "CRM sync, pipelines, and lead routing",
      connected: false,
    },
    {
      name: "Stripe",
      description: "Billing and subscriptions",
      connected: false,
    },
    {
      name: "Resend",
      description: "Transactional email notifications",
      connected: false,
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void refreshGhlStatus();
  }, []);

  async function refreshGhlStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/crm/status", {
        method: "GET",
      });
      const json = (await res.json()) as {
        data?: { connected?: boolean; authType?: string };
        error?: string;
      };
      if (json.data) {
        setIntegrations((prev) =>
          prev.map((i) =>
            i.name === "GoHighLevel"
              ? { ...i, connected: Boolean(json.data?.connected), authType: json.data?.authType }
              : i,
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <RealtorLayoutShell title="Integrations" description="Connect CRM, billing, and email.">
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{integration.name}</CardTitle>
                <Badge variant={integration.connected ? "default" : "outline"}>
                  {integration.connected ? "Connected" : "Not connected"}
                </Badge>
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {integration.name === "GoHighLevel" && (
                <Button size="sm" variant="outline" onClick={refreshGhlStatus} disabled={loading}>
                  {loading ? "Checking..." : "Check private token"}
                </Button>
              )}
              {integration.name === "GoHighLevel" && (
                <p className="text-xs text-muted-foreground">
                  Phase 1 uses GHL private integration token environment variables only.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </RealtorLayoutShell>
  );
}
