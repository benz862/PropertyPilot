import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-36 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label={siteConfig.name}>
          <Image
            src="/pp-logo.png"
            alt={siteConfig.name}
            width={131}
            height={120}
            priority
            className="h-30 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="#features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={siteConfig.links.login}>Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={siteConfig.links.signup}>Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
