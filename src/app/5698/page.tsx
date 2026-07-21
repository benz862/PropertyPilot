import type { Metadata } from "next";
import Script from "next/script";

import { PropertyCarousel, type CarouselPhoto } from "@/components/property/propertypilot-carousel";

import "./listing.css";

const PHOTO_COUNT = 50;

const photos: CarouselPhoto[] = Array.from({ length: PHOTO_COUNT }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return { name: `${number}.jpg`, src: `/5698/assets/photo-${number}.jpg` };
});

export const metadata: Metadata = {
  title: "Mid-Century Modern Masterpiece",
  description: "PropertyPilot listing for Mid-Century Modern Masterpiece.",
};

export default function Property5698Page() {
  return (
    <div className="pp-listing">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand" aria-label="PropertyPilot">
            <span className="brand-symbol" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand-logo" src="/5698/assets/propertypilot-logo.png" alt="" />
            </span>
          </div>
        </div>
      </header>

      <PropertyCarousel photos={photos} autoplay intervalMs={3000} />

      <main>
        <article className="listing-panel">
          <div className="listing-copy">
            <p className="eyebrow">Featured residence</p>
            <h1>Mid-Century Modern Masterpiece</h1>
            <p className="address">5698 Lamplighter Dr.</p>
            <p className="location">Girard, OH 44420</p>
            <div className="description">
              <p>
                Welcome to <b>5698 Lamplighter Drive</b>, a remarkable custom mid-century modern home
                set on <b>3.26 private acres</b>. Expansive living-room and family-room windows flood
                the interior with natural light while framing peaceful backyard views and creating an
                effortless connection with nature. Beyond the tennis court, approximately two wooded
                acres provide a beautiful forest backdrop.
              </p>
              <p>
                Offering more than 4,300 square feet, the home pairs authentic architectural character
                with thoughtful updates. Vaulted ceilings, a sunken living room, three fireplaces, a
                wet bar and extensive built-ins are complemented by fresh paint, a new roof, new LED
                lighting and new commercial-grade laminate flooring.
              </p>
              <p>
                The newer West Wing features an oversized accessible bedroom and ensuite bathroom with
                a <b>roll-in shower.</b> A dedicated gym, flexible multipurpose room, full basement and
                upgraded 400-amp electrical service add exceptional versatility.
              </p>
              <p>
                Outside, landscaped grounds, a gazebo, patio, storage shed and private tennis court
                invite recreation and relaxation.
              </p>
              <p>
                <b>
                  Architecturally distinctive, beautifully private and wonderfully connected to nature
                  - this is a home unlike any other.
                </b>
              </p>
            </div>
          </div>
          <aside className="listing-summary" aria-label="Listing summary">
            <p className="price">$574,900</p>
            <dl className="facts">
              <div className="fact">
                <dt>Beds</dt>
                <dd>4</dd>
              </div>
              <div className="fact">
                <dt>Baths</dt>
                <dd>4</dd>
              </div>
              <div className="fact">
                <dt>Sq Ft</dt>
                <dd>4372</dd>
              </div>
            </dl>
            <span className="status">Active listing</span>
          </aside>
        </article>

        <section className="agent-card" aria-label="Listing agent">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="agent-photo" src="/5698/assets/agent-photo.jpg" alt="Babette Plake, real estate agent" />
          <div className="agent-details">
            <p className="agent-kicker">Your listing contact</p>
            <h2>Babette Plake</h2>
            <p className="agent-role">Realtor® · Platinum Estate Group</p>
            <p className="agent-tagline">
              Selling homes one at a time, with care and a stress-free experience.
            </p>
            <div className="agent-contact">
              <a href="tel:2348554676" aria-label="Call Babette Plake">
                (234) 855-4676
              </a>
              <a href="mailto:batiaplake@kw.com">batiaplake@kw.com</a>
              <a href="https://platinumestatesgroup.kw.com/" target="_blank" rel="noopener">
                Visit website
              </a>
            </div>
          </div>
          <div className="agent-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="agent-logo" src="/5698/assets/brokerage-logo.jpg" alt="Platinum Estate Group logo" />
          </div>
        </section>
      </main>

      <footer>PropertyPilot by SkillBinder / Epoxy Dogs LLC</footer>

      <Script
        src="https://widgets.leadconnectorhq.com/loader.js"
        data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
        data-widget-id="6a5fd58c09694f814a7751c6"
        strategy="afterInteractive"
      />
    </div>
  );
}
