import Script from "next/script";

import { LamplighterPhotoCarousel } from "@/components/property/lamplighter-photo-carousel";

export default function Property5698Page() {
  return (
    <main className="min-h-screen bg-[#112d3b] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-white/15 bg-white/10 px-6 py-7 shadow-xl backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">Property information assistant</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">5698 Lamplighter Drive</h1>
          <p className="mt-1 text-lg text-slate-200">Girard, Ohio 44420</p>
          <div className="mt-5 border-t border-white/15 pt-4 text-sm text-slate-100 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="font-semibold text-white">Marcus A. Agee</p>
              <p>Keller Williams Chervenic Realty</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 sm:mt-0 sm:text-right">
              <a className="underline decoration-amber-300 underline-offset-4 hover:text-amber-200" href="tel:+13305020184">330-502-0184</a>
              <a className="underline decoration-amber-300 underline-offset-4 hover:text-amber-200" href="mailto:marcusagee@kw.com">marcusagee@kw.com</a>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur">
          <h2 className="text-lg font-semibold">Ask the property voice agent</h2>
          <p className="mt-1 text-sm text-slate-200">Use the chat assistant in the lower-right corner for property questions or to request a showing.</p>
        </section>

        <LamplighterPhotoCarousel />
      </div>

      <Script
        src="https://widgets.leadconnectorhq.com/loader.js"
        data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
        data-widget-id="6a539e67c02522215a033cf3"
        strategy="afterInteractive"
      />
    </main>
  );
}
