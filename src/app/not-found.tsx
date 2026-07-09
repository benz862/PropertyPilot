import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The property, page, or workspace view you requested is not available.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" aria-hidden />
          Back to dashboard
        </Link>
      </Button>
    </main>
  );
}
