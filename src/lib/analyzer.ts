export type AnalysisResult = {
  score: number;
  level: { label: string; tone: "exceptional" | "excellent" | "good" | "rewrite" };
  recommendations: string[];
  improved: string;
  breakdown: { label: string; delta: number }[];
};

const SENSORY = ["fondant", "fondante", "nacré", "nacrée", "crémeux", "crémeuse", "croquant", "croquante", "doré", "dorée"];
const ORIGIN = ["ligne", "fermier", "fermière", "aop", "producteur", "productrice"];
const COOKING = ["basse température", "basse temperature", "poêlé", "poele", "poêlée", "rôti", "rotie", "rôtie", "roti", "confit", "confite"];
const EMPTY = ["délicieux", "delicieux", "délicieuse", "bon", "bonne", "superbe", "excellent", "excellente"];

const ADJ_HINT = /(é|ée|és|ées|eux|euse|ant|ante|if|ive|al|ale)\b/i;

function containsAny(text: string, list: string[]): string | null {
  const t = text.toLowerCase();
  for (const w of list) {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(t)) return w;
  }
  return null;
}

function hasAdjective(text: string): boolean {
  const words = text.toLowerCase().split(/[\s,;.'’-]+/).filter(Boolean);
  return words.some((w) => w.length > 3 && ADJ_HINT.test(w));
}

export function analyze(input: string): AnalysisResult {
  const text = input.trim();
  const words = text.split(/\s+/).filter(Boolean);
  let score = 50;
  const breakdown: { label: string; delta: number }[] = [];

  const sensory = containsAny(text, SENSORY);
  if (sensory) { score += 15; breakdown.push({ label: `Mot sensoriel ("${sensory}")`, delta: 15 }); }

  const origin = containsAny(text, ORIGIN);
  if (origin) { score += 15; breakdown.push({ label: `Origine ("${origin}")`, delta: 15 }); }

  const cooking = containsAny(text, COOKING);
  if (cooking) { score += 15; breakdown.push({ label: `Précision de cuisson ("${cooking}")`, delta: 15 }); }

  if (words.length < 5) { score -= 20; breakdown.push({ label: "Description trop courte (< 5 mots)", delta: -20 }); }

  const empty = containsAny(text, EMPTY);
  if (empty) { score -= 15; breakdown.push({ label: `Mot vide ("${empty}")`, delta: -15 }); }

  if (!hasAdjective(text)) { score -= 10; breakdown.push({ label: "Aucun adjectif descriptif", delta: -10 }); }

  score = Math.max(0, Math.min(100, score));

  let level: AnalysisResult["level"];
  if (score >= 90) level = { label: "Exceptionnel", tone: "exceptional" };
  else if (score >= 70) level = { label: "Excellent", tone: "excellent" };
  else if (score >= 50) level = { label: "Bon", tone: "good" };
  else level = { label: "À réécrire", tone: "rewrite" };

  const recommendations: string[] = [];
  if (!sensory) recommendations.push("Ajoutez un mot sensoriel (fondant, nacré, crémeux, croquant, doré) pour faire saliver le lecteur.");
  if (!origin) recommendations.push("Précisez l'origine ou la provenance (de ligne, fermier, AOP, du producteur) pour rassurer et valoriser.");
  if (!cooking) recommendations.push("Indiquez la cuisson (basse température, poêlé, rôti, confit) pour montrer votre savoir-faire.");
  if (empty) recommendations.push(`Remplacez le mot vide "${empty}" par une description concrète et évocatrice.`);
  if (words.length < 5) recommendations.push("Étoffez la description : visez 8 à 15 mots qui racontent le plat.");
  if (!hasAdjective(text)) recommendations.push("Ajoutez au moins un adjectif descriptif pour donner vie au plat.");
  while (recommendations.length < 3) {
    const extras = [
      "Mentionnez une garniture ou un accompagnement signature pour différencier votre plat.",
      "Ajoutez une touche d'émotion ou de souvenir (de notre région, comme à la maison, signature du chef).",
      "Précisez la texture finale en bouche pour transporter le client avant même la première bouchée.",
    ];
    for (const e of extras) if (!recommendations.includes(e)) { recommendations.push(e); break; }
  }

  const improved = improve(text, { sensory: !!sensory, origin: !!origin, cooking: !!cooking });

  return { score, level, recommendations: recommendations.slice(0, 3), improved, breakdown };
}

function improve(text: string, has: { sensory: boolean; origin: boolean; cooking: boolean }): string {
  let base = text.trim().replace(/\.$/, "");
  const additions: string[] = [];
  if (!has.cooking) additions.push("cuit à basse température");
  if (!has.sensory) additions.push("au cœur fondant et à la peau dorée");
  if (!has.origin) additions.push("issu d'une pêche de ligne");
  const enriched = additions.length ? `${base}, ${additions.join(", ")}` : base;
  return `${enriched.charAt(0).toUpperCase() + enriched.slice(1)}, sublimé d'un jus crémeux et d'une garniture de saison du producteur.`;
}
