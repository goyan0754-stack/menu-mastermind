import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
const STORAGE_KEY = "tai_analyzer_count";

function Index() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [count, setCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    const safe = isNaN(stored) ? 0 : stored;
    setCount(safe);
    if (safe >= FREE_LIMIT) setLimitReached(true);
  }, []);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    if (count >= FREE_LIMIT) {
      setLimitReached(true);
      return;
    }
    const next = count + 1;
    setCount(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(next));
    setResult(analyze(text));
    if (next >= FREE_LIMIT) {
      // L'utilisateur vient d'utiliser sa 3e analyse : on lui montre le résultat,
      // mais le prochain clic basculera sur l'écran de limite.
    }
    setTimeout(() => {
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const remaining = Math.max(0, FREE_LIMIT - count);

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
        </header>

        {limitReached ? (
          <section className="rounded-2xl p-8 sm:p-10 shadow-sm border text-center" style={{ backgroundColor: "var(--brand-beige-soft)", borderColor: "var(--brand-gold)" }}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Vous avez utilisé vos 3 analyses gratuites.</h2>
            <p className="text-base sm:text-lg leading-relaxed mb-3" style={{ opacity: 0.85 }}>
              Vous avez vu la différence entre vos mots et nos descriptions. Maintenant, imaginez toute votre carte réécrite par un ancien chef.
            </p>
            <p className="text-base sm:text-lg leading-relaxed mb-6">
              Henri, ancien chef pendant 16 ans, peut transformer vos ventes. Ses résultats mesurés :{" "}
              <strong style={{ color: "var(--brand-olive)" }}>+34 % de ventes, +47 % de prix moyen perçu.</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://tai-food.com/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "var(--brand-olive)", color: "var(--brand-olive-foreground)" }}
              >
                Contacter Henri
              </a>
              <a
                href="mailto:contact@taifood.com"
                className="inline-block px-8 py-3 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98] border"
                style={{ borderColor: "var(--brand-olive)", color: "var(--brand-olive)" }}
              >
                Envoyer un email
              </a>
            </div>
            <p className="mt-6 text-sm sm:text-base italic" style={{ opacity: 0.8 }}>
              Ne laissez plus vos plats être vendus par des mots faibles. Un coup de pouce sur votre carte et votre chiffre d'affaires peut décoller dès demain.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl p-6 sm:p-8 shadow-sm border" style={{ backgroundColor: "var(--brand-beige-soft)", borderColor: "oklch(0.88 0.012 85)" }}>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="dish" className="block text-sm font-medium">
                Description de votre plat
              </label>
              <span className="text-xs" style={{ opacity: 0.7 }}>
                {remaining} analyse{remaining > 1 ? "s" : ""} gratuite{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}
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
    </div>
  );
}
