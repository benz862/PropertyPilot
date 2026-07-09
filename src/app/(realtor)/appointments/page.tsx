import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppointmentsPage() {
  return (
    <RealtorLayoutShell
      title="Appointments"
      description="Showing requests and scheduled visits."
    >
      <Card>
        <CardHeader>
          <CardTitle>No appointments yet</CardTitle>
          <CardDescription>
            Showing requests from buyer tours will appear here for scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Calendar integration coming in a future release.
          </p>
        </CardContent>
      </Card>
    </RealtorLayoutShell>
  );
}
