import Link from "next/link";
import { Brand } from "@/components/Brand";
import { PixelWorld } from "@/components/PixelWorld";
import { CountdownTimer } from "@/components/CountdownTimer";

export default function Home() {
  const launchDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="page-shell-dark">
      <main className="home-main">
        {/* ===================== HERO SECTION ===================== */}
        <section className="target-hero">
          <div className="container-target target-hero__grid">
            {/* Left Hero Column */}
            <div className="target-hero__left">
              <span className="target-eyebrow">
                <i className="sq-red" /> KYBERNETICKÝ TRÉNING &amp; CTF PLATFORMA
              </span>

              <h1 className="target-hero__title">
                Trénuj.<br />
                Hackuj.<br />
                Vyhraj<span className="dot-red">!</span>
              </h1>

              <p className="target-hero__lead">
                Praktické výzvy, školské triedy a živé CTF podujatia v&nbsp;jednom portáli.
              </p>

              {/* Hero CTA Buttons */}
              <div className="target-hero__actions">
                <Link className="btn-target-primary" href="/countdown">
                  Začať sa učiť <span aria-hidden="true">→</span>
                </Link>
                <Link className="btn-target-secondary" href="/countdown">
                  Pozrieť podujatia
                </Link>
              </div>
            </div>

            {/* Right Hero Column: Live Countdown Box */}
            <div className="target-hero__right">
              <CountdownTimer
                targetDate={launchDate}
                title="SPUSTENIE SEZÓNY O"
                subtitle="Registrácia je otvorená. Zadaj email a získaš okamžitú notifikáciu pri štarte súťaže."
              />
            </div>
          </div>
        </section>

        {/* ===================== FULL-BLEED PIXEL ART SCENE ===================== */}
        <section className="pixel-art-band">
          <PixelWorld className="pixel-art-canvas" />
        </section>
      </main>

      {/* ===================== TARGET FOOTER ===================== */}
      <footer className="target-footer">
        <div className="container-target target-footer__grid">
          {/* Column 1: Brand & Social */}
          <div className="target-footer__col-brand">
            <Brand locale="sk" />
            <p className="target-footer__desc">
              HACKUJ je slovenská platforma, na praktický tréning a živé CTF podujatia v bezpečnom hacker prostredí.
            </p>
            <div className="target-footer__socials">
              <a href="https://github.com/hackuj/hackuj-countdown-landing" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Platforma */}
          <div className="target-footer__col">
            <h4>PLATFORMA</h4>
            <Link href="/countdown">Výzvy</Link>
            <Link href="/countdown">Podujatia</Link>
            <Link href="/countdown">Triedy</Link>
            <Link href="/countdown">Rebríček</Link>
          </div>

          {/* Column 3: Komunita */}
          <div className="target-footer__col">
            <h4>KOMUNITA</h4>
            <Link href="#">Blog</Link>
            <Link href="#">FAQ</Link>
            <Link href="#">Pravidlá</Link>
            <Link href="#">Kontakt</Link>
          </div>

          {/* Column 4: Právne */}
          <div className="target-footer__col">
            <h4>PRÁVNE</h4>
            <Link href="#">Podmienky</Link>
            <Link href="#">Ochrana súkromia</Link>
            <Link href="#">Cookies</Link>
          </div>
        </div>

        <div className="target-footer__bottom">
          <div className="container-target">
            <p>© 2026 HACKUJ. Všetky práva vyhradené.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
