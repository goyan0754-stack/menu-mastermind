import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { analyze, type AnalysisResult } from "@/lib/analyzer";
import { ScoreGauge } from "@/components/ScoreGauge";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "TA&I Analyzer — Analysez vos descriptions de plats" },
      { name: "description", content: "Découvrez pourquoi vos clients passent à côté de vos meilleurs plats. Analysez gratuitement vos descriptions et obtenez des recommandations." },
      { property: "og:title", content: "TA&I Analyzer" },
      { property: "og:description", content: "Découvrez pourquoi vos clients passent à côté de vos meilleurs plats." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
});

const FREE_LIMIT = 3;
const COUNT_KEY = "tai_analyzer_count";
const PAID_CREDITS_KEY = "tai_analyzer_paid_credits";
const STRIPE_URL = "https://buy.stripe.com/8x2dR99KR0KL2fd5sCd7q01";
const ADMIN_CODE = "ADMIN2026";

function Index() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [count, setCount] = useState(0);
  const [paidCredits, setPaidCredits] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const keyBufferRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCount = parseInt(window.localStorage.getItem(COUNT_KEY) ?? "0", 10);
    const storedPaid = parseInt(window.localStorage.getItem(PAID_CREDITS_KEY) ?? "0", 10);
    setCount(isNaN(storedCount) ? 0 : storedCount);
    setPaidCredits(isNaN(storedPaid) ? 0 : storedPaid);
  }, []);

  // Code admin: détecter "ADMIN2026" tapé sur la page
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      keyBufferRef.current = (keyBufferRef.current + e.key).slice(-ADMIN_CODE.length);
      if (keyBufferRef.current.toUpperCase() === ADMIN_CODE) {
        setAdminOpen(true);
        keyBufferRef.current = "";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const freeRemaining = Math.max(0, FREE_LIMIT - count);
  const totalCredits = freeRemaining + paidCredits;
  const limitReached = totalCredits <= 0;

  const handleAnalyze = () => {
    if (!text.trim()) return;
    if (totalCredits <= 0) return;

    // Consommer d'abord le crédit gratuit, puis les crédits payants
    if (freeRemaining > 0) {
      const next = count + 1;
      setCount(next);
      if (typeof window !== "undefined") window.localStorage.setItem(COUNT_KEY, String(next));
    } else {
      const nextPaid = paidCredits - 1;
      setPaidCredits(nextPaid);
      if (typeof window !== "undefined") window.localStorage.setItem(PAID_CREDITS_KEY, String(nextPaid));
    }

    setResult(analyze(text));
    setTimeout(() => {
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleAddPaidCredit = () => {
    const next = paidCredits + 1;
    setPaidCredits(next);
    if (typeof window !== "undefined") window.localStorage.setItem(PAID_CREDITS_KEY, String(next));
  };

  const handleAdminAddCredits = () => {
    if (!adminEmail.trim()) {
      setAdminMessage("Veuillez entrer un email.");
      return;
    }
    const next = paidCredits + 5;
    setPaidCredits(next);
    if (typeof window !== "undefined") window.localStorage.setItem(PAID_CREDITS_KEY, String(next));
    setAdminMessage(`+5 crédits ajoutés (localement) pour ${adminEmail}.`);
  };

  const handleAdminReset = () => {
    setCount(0);
    setPaidCredits(0);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COUNT_KEY, "0");
      window.localStorage.setItem(PAID_CREDITS_KEY, "0");
    }
    setResult(null);
    setAdminMessage("Tous les crédits ont été remis à zéro.");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--brand-beige)", color: "var(--brand-dark)" }}>
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
        <header className="text-center mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            TA&amp;I <span style={{ color: "var(--brand-olive)" }}>Analyzer</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl" style={{ opacity: 0.8 }}>
            Découvrez pourquoi vos clients passent à côté de vos meilleurs plats.
          </p>
          <div className="mt-5 inline-block px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: "var(--brand-beige-soft)", border: "1px solid var(--brand-gold)" }}>
            Crédits disponibles : <strong style={{ color: "var(--brand-olive)" }}>{totalCredits}</strong>
          </div>
        </header>

        {limitReached ? (
          <section className="rounded-2xl p-8 sm:p-10 shadow-sm border text-center" style={{ backgroundColor: "var(--brand-beige-soft)", borderColor: "var(--brand-gold)" }}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Vous avez utilisé vos 3 analyses gratuites.</h2>
            <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ opacity: 0.85 }}>
              Vous voulez analyser un autre plat ? Débloquez 1 analyse supplémentaire pour 7,01€.
            </p>

            <a
              href={STRIPE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:opacity-90 active:scale-[0.98] shadow-md"
              style={{ backgroundColor: "var(--brand-gold)", color: "var(--brand-gold-foreground)" }}
            >
              <span aria-hidden>🔓</span>
              Débloquer 1 analyse — 7,01€
            </a>

            <div className="mt-6">
              <button
                onClick={handleAddPaidCredit}
                className="px-6 py-2 rounded-lg font-medium text-sm border transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ borderColor: "var(--brand-olive)", color: "var(--brand-olive)", backgroundColor: "white" }}
              >
                J'ai payé. Ajouter 1 crédit.
              </button>
              <p className="mt-2 text-xs" style={{ opacity: 0.6 }}>
                Cliquez ici après votre paiement pour débloquer votre analyse.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t" style={{ borderColor: "oklch(0.88 0.012 85)" }}>
              <p className="text-base leading-relaxed mb-4">
                Henri, ancien chef pendant 16 ans, peut transformer toute votre carte.{" "}
                <strong style={{ color: "var(--brand-olive)" }}>+34 % de ventes, +47 % de prix moyen perçu.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://tai-food.com/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: "var(--brand-olive)", color: "var(--brand-olive-foreground)" }}
                >
                  Audit TA&amp;I
                </a>
                <a
                  href="https://tai-food.com/temoignages/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98] border"
                  style={{ borderColor: "var(--brand-olive)", color: "var(--brand-olive)" }}
                >
                  Témoignages
                </a>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl p-6 sm:p-8 shadow-sm border" style={{ backgroundColor: "var(--brand-beige-soft)", borderColor: "oklch(0.88 0.012 85)" }}>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="dish" className="block text-sm font-medium">
                Description de votre plat
              </label>
              <span className="text-xs" style={{ opacity: 0.7 }}>
                {totalCredits} analyse{totalCredits > 1 ? "s" : ""} restante{totalCredits > 1 ? "s" : ""}
              </span>
            </div>
            <textarea
              id="dish"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pavé de cabillaud, riz, légumes"
              rows={3}
              className="w-full rounded-xl border px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 transition"
              style={{
                backgroundColor: "white",
                borderColor: "oklch(0.85 0.012 85)",
                color: "var(--brand-dark)",
              }}
            />
            <button
              onClick={handleAnalyze}
              disabled={!text.trim()}
              className="mt-4 w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--brand-olive)", color: "var(--brand-olive-foreground)" }}
            >
              Analyser
            </button>
          </section>
        )}

        {result && !limitReached && (
          <section id="result" className="mt-10 space-y-8 animate-in fade-in duration-500">
            <div className="rounded-2xl p-6 sm:p-8 bg-white shadow-sm border text-center" style={{ borderColor: "oklch(0.88 0.012 85)" }}>
              <ScoreGauge score={result.score} />
              <div className="mt-4">
                <div className="text-2xl font-semibold">{result.level.label}</div>
                <div className="mt-2 text-sm" style={{ opacity: 0.7 }}>
                  {result.level.tone === "exceptional" && "Une description qui fait saliver. Vos plats partent les premiers."}
                  {result.level.tone === "excellent" && "Très bonne description. Quelques détails et elle deviendra irrésistible."}
                  {result.level.tone === "good" && "Description correcte mais oubliable. Vos meilleurs plats méritent mieux."}
                  {result.level.tone === "rewrite" && "À réécrire. Vos clients ne peuvent pas imaginer ce plat — donc ils ne le commandent pas."}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 bg-white shadow-sm border" style={{ borderColor: "oklch(0.88 0.012 85)" }}>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--brand-olive)", opacity: 0.9 }}>
                Formule détectée
              </div>
              <h2 className="text-xl font-semibold mb-1">{result.formula.name}</h2>
              <p className="text-sm" style={{ opacity: 0.7 }}>{result.formula.short}</p>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 bg-white shadow-sm border" style={{ borderColor: "oklch(0.88 0.012 85)" }}>
              <h2 className="text-xl font-semibold mb-4">3 recommandations personnalisées</h2>
              <ul className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: "var(--brand-olive)", color: "var(--brand-olive-foreground)" }}>
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 shadow-sm border" style={{ backgroundColor: "var(--brand-beige-soft)", borderColor: "var(--brand-gold)" }}>
              <h2 className="text-xl font-semibold mb-3">Version améliorée</h2>
              <p className="text-lg italic leading-relaxed" style={{ color: "var(--brand-dark)" }}>
                « {result.improved} »
              </p>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 text-center shadow-sm" style={{ backgroundColor: "var(--brand-dark)", color: "white" }}>
              <p className="text-base sm:text-lg leading-relaxed">
                Je suis Henri, ancien chef 16 ans. <strong style={{ color: "var(--brand-gold)" }}>+34% ventes, +47% prix moyen.</strong>
              </p>
              <a
                href="https://tai-food.com/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-5 px-8 py-3 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "var(--brand-gold)", color: "var(--brand-gold-foreground)" }}
              >
                Demander un audit gratuit
              </a>
            </div>
          </section>
        )}
      </main>

      <footer className="w-full py-8 text-center text-sm" style={{ opacity: 0.7 }}>
        <a
          href="https://tai-food.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: "var(--brand-dark)" }}
        >
          TA&amp;I Copywriting &amp; Concept — Ancien chef spécialisé restauration
        </a>
      </footer>

      {/* Panneau Admin (caché — ouvert via le code ADMIN2026) */}
      {adminOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setAdminOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: "var(--brand-dark)" }}>Panneau Admin</h3>
              <button
                onClick={() => { setAdminOpen(false); setAdminMessage(""); }}
                className="text-2xl leading-none px-2"
                style={{ color: "var(--brand-dark)", opacity: 0.6 }}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <p className="text-xs mb-4" style={{ opacity: 0.6 }}>
              Note : les crédits sont stockés localement dans ce navigateur.
            </p>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--brand-dark)" }}>
              Email du client
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full rounded-lg border px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2"
              style={{ borderColor: "oklch(0.85 0.012 85)" }}
            />
            <button
              onClick={handleAdminAddCredits}
              className="w-full px-4 py-2 rounded-lg font-semibold text-sm mb-2 transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--brand-olive)", color: "var(--brand-olive-foreground)" }}
            >
              Ajouter 5 crédits à cet email
            </button>
            <button
              onClick={handleAdminReset}
              className="w-full px-4 py-2 rounded-lg font-semibold text-sm border transition-all hover:opacity-90"
              style={{ borderColor: "var(--brand-dark)", color: "var(--brand-dark)", backgroundColor: "white" }}
            >
              Remettre à zéro tous les crédits
            </button>
            {adminMessage && (
              <p className="mt-3 text-sm text-center" style={{ color: "var(--brand-olive)" }}>
                {adminMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
