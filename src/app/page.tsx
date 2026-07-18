import Link from "next/link";
import { Mic, QrCode, ShieldCheck, Sparkles } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";

const features = [
  {
    icon: QrCode,
    title: "One QR code",
    description:
      "Buyers scan once at the front door. No app install, no account, no friction.",
  },
  {
    icon: Mic,
    title: "Natural conversation",
    description:
      "Voice AI that feels like an experienced realtor — concise, professional, helpful.",
  },
  {
    icon: ShieldCheck,
    title: "Honest answers",
    description:
      "The AI never guesses. Unknown information is acknowledged, not invented.",
  },
  {
    icon: Sparkles,
    title: "Qualified leads",
    description:
      "Capture buyer interest, email brochures, and push leads into your CRM automatically.",
  },
];

const steps = [
  "Create a listing and upload property details",
  "Add photos and points of interest",
  "Print the QR code and place it at the entrance",
  "Buyers scan, select their location, and start talking",
  "Receive qualified leads with tour analytics",
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-background to-background" />

          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
                The always-on guide for every showing
              </p>

              <h1 className="text-4xl font-bold tracking-normal text-foreground sm:text-5xl lg:text-6xl">
                Turn every showing into a{" "}
                <span className="text-primary">conversation that moves buyers forward.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {siteConfig.description}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" className="min-w-44" asChild>
                  <Link href={siteConfig.links.signup}>Create your first experience</Link>
                </Button>
                <Button size="lg" variant="outline" className="min-w-44" asChild>
                  <Link href="#how-it-works">See it in action</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-secondary/30 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-normal sm:text-4xl">
                Built for buyers. Designed for agents.
              </h2>
              <p className="mt-4 text-muted-foreground">
                PropertyPilot reduces repetitive questions, increases engagement,
                and delivers measurable results.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/60 shadow-sm">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent/20 text-primary">
                      <feature.icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-normal sm:text-4xl">
                  From listing to lead in minutes
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Realtors create an AI property tour in under 15 minutes. Buyers
                  scan one QR code and immediately begin speaking with the AI.
                </p>
                <Button className="mt-8" asChild>
                  <Link href={siteConfig.links.signup}>Create your first tour</Link>
                </Button>
              </div>

              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-border bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-normal sm:text-4xl">
              Ready to transform your showings?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Join listing agents, brokerages, and builders who use PropertyPilot
              to differentiate their marketing and qualify better leads.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
              asChild
            >
              <Link href={siteConfig.links.signup}>Get started today</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
