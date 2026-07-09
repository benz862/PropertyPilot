import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function TourNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">Tour not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        This property tour may not be published yet, or the link may be incorrect.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">Go to PropertyPilot</Link>
      </Button>
    </main>
  );
}
