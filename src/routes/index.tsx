import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

function Index() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setResult(analyze(text));
    setTimeout(() => {
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
        </header>

        <section className="rounded-2xl p-6 sm:p-8 shadow-sm border" style={{ backgroundColor: "var(--brand-beige-soft)", borderColor: "oklch(0.88 0.012 85)" }}>
          <label htmlFor="dish" className="block text-sm font-medium mb-2">
            Description de votre plat
          </label>
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

        {result && (
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
                href="https://tai-food.com"
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
