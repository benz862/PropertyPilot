"use client";

import { useEffect, useState } from "react";

import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { GhlSetupBuilder } from "@/components/crm/ghl-setup-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

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
  const [locationId, setLocationId] = useState("");
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

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

  async function saveGhlLocation() {
    setLoading(true);
    setConnectionMessage(null);
    try {
      const response = await fetch("/api/v1/crm/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
      });
      const payload = (await response.json()) as { error?: { message?: string }; data?: { locationId?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Could not save GoHighLevel connection.");
      setConnectionMessage("GoHighLevel destination saved. New leads will route only to this sub-account.");
      await refreshGhlStatus();
    } catch (error) {
      setConnectionMessage(error instanceof Error ? error.message : "Could not save GoHighLevel connection.");
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
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="ghl-location-id">This agent&apos;s GHL Location ID</Label>
                    <Input
                      id="ghl-location-id"
                      value={locationId}
                      onChange={(event) => setLocationId(event.target.value)}
                      placeholder="Paste the Location ID, not a token"
                    />
                  </div>
                  <Button size="sm" onClick={saveGhlLocation} disabled={loading || !locationId.trim()}>
                    Save lead destination
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PropertyPilot keeps the private integration token securely on the server. This ID only selects this agent&apos;s own GHL sub-account.
                  </p>
                  {connectionMessage && <Alert variant="info" title="GoHighLevel">{connectionMessage}</Alert>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>GoHighLevel listing setup builder</CardTitle>
          <CardDescription>
            Answer the brokerage and listing questions once, then copy or download the populated setup document for GoHighLevel Ask AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GhlSetupBuilder />
        </CardContent>
      </Card>
    </RealtorLayoutShell>
  );
}
