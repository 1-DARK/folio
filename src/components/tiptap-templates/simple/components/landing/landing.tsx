import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LANDING_COPY, type LandingLang } from "./landing-copy";
import { FolioMark } from "../folio-mark";
import "./landing.scss";

type LandingTheme = "light" | "dark";
const THEME_KEY = "folio-landing-theme";

function initialTheme(): LandingTheme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage blocked */
  }
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// A framed placeholder where a real screenshot (or embedded page) goes later.
// Swap the inner label for an <img> — the frame keeps the layout.
function Shot({ label, ratio }: { label: string; ratio: string }) {
  return (
    <div className="landing-shot" style={{ aspectRatio: ratio }}>
      <span className="landing-shot__label">{label}</span>
    </div>
  );
}

/**
 * The public page signed-out visitors see at "/". A feature tour in the
 * style of a product docs page, in French and English (follows i18next) and
 * light / dark (follows the system until toggled, remembered per browser).
 */
export function Landing({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  const { i18n } = useTranslation();
  const lang: LandingLang = i18n.language?.startsWith("en") ? "en" : "fr";
  const c = LANDING_COPY[lang];

  const [theme, setTheme] = useState<LandingTheme>(initialTheme);
  const [tabId, setTabId] = useState(c.blocks.tabs[0].id);
  const tab = c.blocks.tabs.find((t) => t.id === tabId) ?? c.blocks.tabs[0];

  const toggleTheme = () => {
    const next: LandingTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked */
    }
  };

  return (
    <div className="landing" data-theme={theme} lang={lang}>
      <header className="landing-nav">
        <a href="/" className="landing-logo">
          <FolioMark size={26} title="" className="landing-logo__mark" />
          Folio
        </a>
        <nav className="landing-nav__links" aria-label={c.nav.features}>
          <a href="#features">{c.nav.features}</a>
          <a href="#templates">{c.nav.templates}</a>
          <a href="#offline">{c.nav.offline}</a>
        </nav>
        <div className="landing-nav__spacer" />
        <div className="landing-lang" role="group" aria-label={c.nav.language}>
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              className={lang === l ? "is-active" : undefined}
              onClick={() => void i18n.changeLanguage(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="landing-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? c.nav.themeLight : c.nav.themeDark}
          title={theme === "dark" ? c.nav.themeLight : c.nav.themeDark}
        >
          {theme === "dark" ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
            </svg>
          )}
        </button>
        <span className="landing-nav__divider" />
        <button type="button" className="landing-link-btn" onClick={onSignIn}>
          {c.nav.signIn}
        </button>
        <button
          type="button"
          className="landing-btn landing-btn--primary landing-btn--sm"
          onClick={onGetStarted}
        >
          {c.nav.cta}
        </button>
      </header>

      <main>
        <section className="landing-hero">
          <h1>{c.hero.title}</h1>
          <p className="landing-hero__sub">
            <strong>{c.hero.lead}</strong> {c.hero.sub}
          </p>
          <div className="landing-actions">
            <button
              type="button"
              className="landing-btn landing-btn--primary"
              onClick={onGetStarted}
            >
              {c.hero.primary}
            </button>
            <a href="#features" className="landing-btn landing-btn--secondary">
              {c.hero.secondary}
            </a>
          </div>
          <div className="landing-hero__shot">
            <Shot label={c.hero.shot} ratio="12 / 7" />
          </div>
        </section>

        <section id="templates" className="landing-section">
          <h2 className="landing-h3">{c.templates.title}</h2>
          <div className="landing-grid landing-grid--4">
            {c.templates.items.map((tp) => (
              <div key={tp.title} className="landing-card landing-card--flush">
                <Shot label={tp.title} ratio="16 / 10" />
                <div className="landing-card__body">
                  <span className="landing-card__title">{tp.title}</span>
                  <span className="landing-muted">{tp.body}</span>
                  <button
                    type="button"
                    className="landing-text-link"
                    onClick={onGetStarted}
                  >
                    {c.templates.use}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="features"
          className="landing-section landing-section--center"
        >
          <h2 className="landing-h2">{c.blocks.title}</h2>
          <p className="landing-lead">{c.blocks.sub}</p>
          <div
            className="landing-tabs"
            role="tablist"
            aria-label={c.blocks.title}
          >
            {c.blocks.tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tab.id}
                className={t.id === tab.id ? "is-active" : undefined}
                onClick={() => setTabId(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="landing-tabpanel" role="tabpanel">
            <div className="landing-tabpanel__text">
              <h3>{tab.title}</h3>
              <p className="landing-muted">{tab.body}</p>
              <code>
                {c.blocks.type} {tab.command}
              </code>
            </div>
            <Shot label={tab.label} ratio="16 / 9" />
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-heading">
            <h2 className="landing-h2">{c.organize.title}</h2>
            <p className="landing-lead">{c.organize.sub}</p>
          </div>
          <Shot label={c.organize.shot} ratio="24 / 8" />
          <div className="landing-grid landing-grid--3">
            {c.organize.points.map((p) => (
              <div key={p.title} className="landing-point">
                <span className="landing-card__title">{p.title}</span>
                <span className="landing-muted">{p.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-heading">
            <h2 className="landing-h2">{c.collab.title}</h2>
            <p className="landing-lead">{c.collab.sub}</p>
          </div>
          <div className="landing-grid landing-grid--3">
            {c.collab.cards.map((card) => (
              <div
                key={card.title}
                className="landing-card landing-card--flush"
              >
                <Shot label={card.shot} ratio="4 / 3" />
                <div className="landing-card__body">
                  <span className="landing-card__title">{card.title}</span>
                  <span className="landing-muted">{card.body}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="offline" className="landing-section landing-split">
          <div className="landing-heading">
            <h2 className="landing-h2">{c.offline.title}</h2>
            <p className="landing-lead">{c.offline.sub}</p>
          </div>
          <div className="landing-steps">
            {c.offline.steps.map((s) => (
              <div key={s.pill} className="landing-step">
                <span className={`landing-pill landing-pill--${s.tone}`}>
                  {s.pill}
                </span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h2 className="landing-h2 landing-h2--sm">{c.roles.title}</h2>
          <div className="landing-grid landing-grid--3">
            {c.roles.items.map((r) => (
              <div key={r.title} className="landing-card landing-card--padded">
                <span className="landing-card__title landing-card__title--lg">
                  {r.title}
                </span>
                <span className="landing-muted">{r.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <span className="landing-eyebrow">{c.included.label}</span>
          <div className="landing-grid landing-grid--2">
            {c.included.items.map((it) => (
              <div key={it.title} className="landing-card landing-card--flush">
                <div className="landing-card__body landing-card__body--roomy">
                  <span className="landing-card__title landing-card__title--xl">
                    {it.title}
                  </span>
                  <span className="landing-muted">{it.body}</span>
                </div>
                <div className="landing-card__inset">
                  <Shot label={it.shot} ratio="16 / 7" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-final">
          <h2>{c.final.title}</h2>
          <p className="landing-lead">{c.final.sub}</p>
          <div className="landing-actions">
            <button
              type="button"
              className="landing-btn landing-btn--primary"
              onClick={onGetStarted}
            >
              {c.final.primary}
            </button>
            <button
              type="button"
              className="landing-btn landing-btn--secondary"
              onClick={onSignIn}
            >
              {c.final.secondary}
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <span className="landing-logo">
            <FolioMark size={24} title="" className="landing-logo__mark" />
            Folio
          </span>
          <span className="landing-muted">{c.footer.tagline}</span>
        </div>
        <div className="landing-footer__meta">
          <span>© 2026 Folio</span>
          <span>{c.footer.legal}</span>
        </div>
      </footer>
    </div>
  );
}
