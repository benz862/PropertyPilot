import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <RealtorLayoutShell title="Settings" description="Account, subscription, and preferences.">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Profile and notification preferences coming in a future release.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure your brokerage, branding, and CRM integrations here.
          </p>
        </CardContent>
      </Card>
    </RealtorLayoutShell>
  );
}
