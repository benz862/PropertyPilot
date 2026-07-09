import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { PropertyWizard } from "@/components/property/property-wizard";

export default function NewPropertyPage() {
  return (
    <RealtorLayoutShell
      title="New Property"
      description="Follow the guided wizard to create your AI property tour."
    >
      <PropertyWizard />
    </RealtorLayoutShell>
  );
}
