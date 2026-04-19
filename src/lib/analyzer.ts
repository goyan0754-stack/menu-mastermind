// Analyzer basé sur le guide "10 Descriptions qui Font Saliver"

export type FormulaKey =
  | "origine"
  | "chiffre"
  | "nostalgie"
  | "technique"
  | "sensoriel"
  | "contraste"
  | "producteur"
  | "transformation"
  | "rarete"
  | "lecon";

export type Formula = {
  key: FormulaKey;
  name: string;
  short: string;
};

export type AnalysisResult = {
  score: number;
  level: { label: string; tone: "exceptional" | "excellent" | "good" | "rewrite" };
  formula: Formula;
  recommendations: string[];
  improved: string;
  breakdown: { label: string; delta: number }[];
};

export const FORMULAS: Record<FormulaKey, Formula> = {
  origine: { key: "origine", name: "L'Origine Racontée", short: "produit local, famille, terroir, altitude" },
  chiffre: { key: "chiffre", name: "Le Chiffre de Confiance", short: "durée, température, quantité précise" },
  nostalgie: { key: "nostalgie", name: "La Nostalgie Activée", short: "grand-mère, souvenir, enfance, odeur" },
  technique: { key: "technique", name: "La Technique Révélée", short: "cuisson précise, savoir-faire unique" },
  sensoriel: { key: "sensoriel", name: "La Promesse Sensorielle", short: "craque, velours, contraste, bouche" },
  contraste: { key: "contraste", name: "Le Contraste Inattendu", short: "chaud/froid, sucré/salé, fondant/croquant" },
  producteur: { key: "producteur", name: "Le Producteur Nommé", short: "nom du producteur, élevage, livraison" },
  transformation: { key: "transformation", name: "La Transformation Visible", short: "processus, temps total, préparation" },
  rarete: { key: "rarete", name: "La Rareté Annoncée", short: "quantité limitée, ce matin seulement" },
  lecon: { key: "lecon", name: "La Leçon qui Vend", short: "mot technique expliqué, effort humain" },
};

const SENSORY = ["fondant", "fondante", "nacré", "nacrée", "crémeux", "crémeuse", "croquant", "croquante", "doré", "dorée", "vif", "vive", "moelleux", "moelleuse", "velours", "soyeux", "craque"];
const ORIGIN = ["aop", "aoc", "igp", "fermier", "fermière", "bio", "local", "locale", "terroir", "ligne", "sauvage"];
const PRODUCER = ["producteur", "productrice", "éleveur", "eleveur", "maraîcher", "maraicher", "famille", "ferme", "domaine"];
const COOKING = ["basse température", "basse temperature", "poêlé", "poele", "poêlée", "rôti", "rotie", "rôtie", "roti", "confit", "confite", "braisé", "braisée", "snacké", "snackée", "grillé", "grillée", "fumé", "fumée", "mijoté", "saisi"];
const CONTRAST = [/chaud[- ]froid/i, /sucr[ée][- ]sal[ée]/i, /fondant.*croquant/i, /croquant.*fondant/i, /douceur.*piquant/i, /piquant.*douceur/i, /contraste/i];
const NOSTALGIA = [/grand[- ]m[èe]re/i, /souvenir/i, /enfance/i, /comme autrefois/i, /tradition/i];
const RARITY = [/ce matin/i, /quantit[ée] limit[ée]/i, /seulement/i, /exclusif/i, /\b\d+ portions?\b/i];
const NUMBERS = /\b\d+\s?(h|heures?|min|minutes?|°c?|°|jours?|mois|m|km|g|kg|cl|ml|portions?|ans?)\b/i;
const EMPTY = ["délicieux", "delicieux", "délicieuse", "bon", "bonne", "superbe", "excellent", "excellente", "savoureux", "savoureuse"];

function containsAny(text: string, list: string[]): string | null {
  const t = text.toLowerCase();
  for (const w of list) {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(t)) return w;
  }
  return null;
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text));
}

// Détection ingrédient principal
type IngType = "fish" | "meat" | "veg" | "starch" | "cheese" | "dessert" | "other";
type Ingredient = { display: string; type: IngType };

const ING_PATTERNS: { match: RegExp; display: string; type: IngType }[] = [
  { match: /\bcabillaud\b/i, display: "cabillaud", type: "fish" },
  { match: /\bsaumon\b/i, display: "saumon", type: "fish" },
  { match: /\bthon\b/i, display: "thon", type: "fish" },
  { match: /\bbar\b/i, display: "bar", type: "fish" },
  { match: /\bdorade\b/i, display: "dorade", type: "fish" },
  { match: /\bsole\b/i, display: "sole", type: "fish" },
  { match: /\b(boeuf|bœuf)\b/i, display: "bœuf", type: "meat" },
  { match: /\bagneau\b/i, display: "agneau", type: "meat" },
  { match: /\bpoulet\b/i, display: "poulet", type: "meat" },
  { match: /\bcanard\b/i, display: "canard", type: "meat" },
  { match: /\bporc\b/i, display: "porc", type: "meat" },
  { match: /\bveau\b/i, display: "veau", type: "meat" },
  { match: /\bchou[- ]fleur\b/i, display: "chou-fleur", type: "veg" },
  { match: /\bcourgette/i, display: "courgette", type: "veg" },
  { match: /\baubergine/i, display: "aubergine", type: "veg" },
  { match: /\bchampignon/i, display: "champignons", type: "veg" },
  { match: /\bpotiron|\bcourge\b/i, display: "courge", type: "veg" },
  { match: /\btomate/i, display: "tomate", type: "veg" },
  { match: /\bbetterave/i, display: "betterave", type: "veg" },
  { match: /\briz\b/i, display: "riz", type: "starch" },
  { match: /\bp[âa]tes?\b/i, display: "pâtes", type: "starch" },
  { match: /\bpommes?[- ]de[- ]terre\b/i, display: "pommes de terre", type: "starch" },
  { match: /\bpur[ée]e\b/i, display: "purée", type: "starch" },
  { match: /\btomme\b/i, display: "tomme", type: "cheese" },
  { match: /\bcomt[ée]\b/i, display: "comté", type: "cheese" },
  { match: /\bbrebis\b/i, display: "brebis", type: "cheese" },
  { match: /\bch[èe]vre\b/i, display: "chèvre", type: "cheese" },
  { match: /\bfromage/i, display: "fromage", type: "cheese" },
  { match: /\bchocolat/i, display: "chocolat", type: "dessert" },
  { match: /\btarte\b/i, display: "tarte", type: "dessert" },
];

function detectMainIngredient(text: string): Ingredient | null {
  for (const p of ING_PATTERNS) {
    if (p.match.test(text)) return { display: p.display, type: p.type };
  }
  return null;
}

// Identifier la formule la plus adaptée selon le contenu
function identifyFormula(text: string, ing: Ingredient | null): FormulaKey {
  if (matchesAny(text, CONTRAST)) return "contraste";
  if (matchesAny(text, NOSTALGIA)) return "nostalgie";
  if (matchesAny(text, RARITY)) return "rarete";
  if (NUMBERS.test(text)) return "chiffre";
  if (containsAny(text, PRODUCER)) return "producteur";
  if (containsAny(text, ORIGIN)) return "origine";
  if (containsAny(text, COOKING)) return "technique";
  if (containsAny(text, SENSORY)) return "sensoriel";

  // Pas de signal fort : choisir la formule la plus adaptée à l'ingrédient
  if (ing) {
    if (ing.type === "cheese") return "origine";
    if (ing.type === "fish") return "producteur";
    if (ing.type === "meat") return "technique";
    if (ing.type === "veg") return "contraste";
    if (ing.type === "starch") return "sensoriel";
    if (ing.type === "dessert") return "nostalgie";
  }
  return "sensoriel";
}

export function analyze(input: string): AnalysisResult {
  const text = input.trim();
  let score = 30;
  const breakdown: { label: string; delta: number }[] = [];

  const ing = detectMainIngredient(text);
  const formulaKey = identifyFormula(text, ing);
  const formula = FORMULAS[formulaKey];

  // Scoring selon les règles du guide
  // Formule bien identifiée = au moins un signal fort détecté
  const hasStrongSignal =
    matchesAny(text, CONTRAST) ||
    matchesAny(text, NOSTALGIA) ||
    matchesAny(text, RARITY) ||
    NUMBERS.test(text) ||
    !!containsAny(text, PRODUCER) ||
    !!containsAny(text, ORIGIN) ||
    !!containsAny(text, COOKING) ||
    !!containsAny(text, SENSORY);

  if (hasStrongSignal) {
    score += 20;
    breakdown.push({ label: `Formule identifiée : ${formula.name}`, delta: 20 });
  }

  const sensory = containsAny(text, SENSORY);
  if (sensory) { score += 15; breakdown.push({ label: `Mot sensoriel ("${sensory}")`, delta: 15 }); }

  const origin = containsAny(text, ORIGIN) || containsAny(text, PRODUCER);
  if (origin) { score += 15; breakdown.push({ label: `Origine ou producteur ("${origin}")`, delta: 15 }); }

  if (NUMBERS.test(text)) { score += 15; breakdown.push({ label: "Chiffre précis (durée, température, quantité)", delta: 15 }); }

  if (matchesAny(text, CONTRAST)) { score += 10; breakdown.push({ label: "Contraste évoqué", delta: 10 }); }

  const empty = containsAny(text, EMPTY);
  if (empty) { score -= 15; breakdown.push({ label: `Mot vide ("${empty}")`, delta: -15 }); }

  score = Math.max(0, Math.min(100, score));

  let level: AnalysisResult["level"];
  if (score >= 90) level = { label: "Exceptionnel", tone: "exceptional" };
  else if (score >= 70) level = { label: "Excellent", tone: "excellent" };
  else if (score >= 50) level = { label: "Bon", tone: "good" };
  else level = { label: "À réécrire", tone: "rewrite" };

  const recommendations = buildRecommendations(formulaKey, ing, text);
  const improved = improve(formulaKey, ing, text);

  return { score, level, formula, recommendations: recommendations.slice(0, 3), improved, breakdown };
}

function ingLabel(ing: Ingredient | null): string {
  return ing ? ing.display : "votre plat";
}

function buildRecommendations(formula: FormulaKey, ing: Ingredient | null, _text: string): string[] {
  const name = ingLabel(ing);

  switch (formula) {
    case "origine":
      return [
        `Précisez la provenance de ${name} (région, altitude, AOP). Les repères géographiques rassurent sur la qualité.`,
        `Nommez la famille ou le domaine producteur. Un nom propre crée immédiatement de la confiance.`,
        `Ajoutez un détail de texture ou de goût lié au terroir (ex : pâte onctueuse, parfum de noisette).`,
      ];
    case "chiffre":
      return [
        `Donnez la durée exacte de cuisson ou de maturation (ex : 7 heures, 24 mois, 65 °C).`,
        `Indiquez la quantité ou la portion (ex : 220 g de viande, 6 pièces, 2 portions à partager).`,
        `Ajoutez un chiffre lié au savoir-faire (ex : 3 jours de fermentation, 48 h de marinade).`,
      ];
    case "nostalgie":
      return [
        `Évoquez un souvenir d'enfance lié à ${name} (recette de grand-mère, dimanche en famille).`,
        `Décrivez une odeur ou un geste familier qui transporte le client (le four ouvert, la cuisson lente).`,
        `Terminez par une promesse émotionnelle (ex : le goût d'avant, comme à la maison).`,
      ];
    case "technique":
      return [
        `Précisez la cuisson exacte de ${name} (basse température, confit, snacké unilatéral, braisé à feu doux).`,
        `Expliquez le geste qui change tout (ex : saisi à la plancha brûlante puis reposé).`,
        `Ajoutez la signature du chef ou la technique maison qui distingue le plat.`,
      ];
    case "sensoriel":
      return [
        `Décrivez la texture en bouche de ${name} (fondant, nacré, crémeux, croquant, velouté).`,
        `Ajoutez une sensation forte (le craque sous la dent, le velours en bouche, la fraîcheur vive).`,
        `Terminez par une phrase qui projette le client à la première bouchée.`,
      ];
    case "contraste":
      return [
        `Mentionnez le contraste de ${name} : cœur fondant et surface caramélisée. Les clients aiment les surprises en bouche.`,
        `Ajoutez une opposition de saveurs ou de températures (douceur/piquant, chaud/froid, sucré/salé).`,
        `Terminez par une promesse d'expérience (ex : un plat qui surprend dès la première bouchée).`,
      ];
    case "producteur":
      return [
        `Nommez le producteur ou le pêcheur de ${name} (prénom, ferme, port d'attache).`,
        `Précisez la fréquence de livraison (ex : livré chaque matin, deux fois par semaine).`,
        `Ajoutez un détail humain (ex : élevage familial depuis 3 générations, pêche du jour).`,
      ];
    case "transformation":
      return [
        `Décrivez le processus complet de ${name} (préparation, marinade, cuisson, repos).`,
        `Indiquez le temps total de travail (ex : 24 h de préparation, 3 jours de maturation).`,
        `Mentionnez ce que le client ne voit pas mais qui change tout (ex : monté à la minute, dressé à la pince).`,
      ];
    case "rarete":
      return [
        `Indiquez une quantité limitée pour ${name} (ex : 8 portions par service, ce midi seulement).`,
        `Précisez la fenêtre de disponibilité (ex : tant qu'il y en a, jusqu'à épuisement).`,
        `Justifiez la rareté (ex : pêche du matin, arrivage hebdomadaire, saison courte).`,
      ];
    case "lecon":
      return [
        `Expliquez en une phrase un mot technique lié à ${name} (ex : "saisi" = scellé à feu vif pour garder le jus).`,
        `Mettez en valeur l'effort humain ou le geste qui demande du temps.`,
        `Terminez par ce que le client gagne (ex : c'est ce qui rend la chair si tendre).`,
      ];
  }
}

function improve(formula: FormulaKey, ing: Ingredient | null, text: string): string {
  const base = text.trim().replace(/[.;]+$/, "").replace(/\s+/g, " ");
  const segments = base.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  const main = segments[0] ?? base;
  const rest = segments.slice(1);

  // Enrichir les segments génériques (sans inventer)
  const enrichedRest = rest.map((seg) => {
    const lower = seg.toLowerCase();
    if (/^l[ée]gumes?$/.test(lower)) return "légumes du moment croquants";
    if (/^riz$/.test(lower)) return "riz crémeux";
    if (/^pur[ée]e$/.test(lower)) return "purée onctueuse";
    if (/^pommes?[- ]de[- ]terre$/.test(lower)) return "pommes de terre fondantes";
    return seg;
  });

  let sentence = "";

  switch (formula) {
    case "origine": {
      const place = ing?.type === "cheese" ? "des estives" : "de notre région";
      sentence = `${cap(main)} ${place}, travaillé avec respect, ${enrichedRest.join(", ") || "servi simplement pour révéler le terroir"}.`;
      break;
    }
    case "chiffre": {
      const dur = ing?.type === "meat" ? "cuit 7 heures à 65 °C" : ing?.type === "fish" ? "cuit 12 minutes à 52 °C" : "préparé sur 24 heures";
      sentence = `${cap(main)}, ${dur}${enrichedRest.length ? ", " + enrichedRest.join(", ") : ""}.`;
      break;
    }
    case "nostalgie": {
      sentence = `${cap(main)} comme à la maison, ${enrichedRest.join(", ") || "le souvenir d'un dimanche en famille"}.`;
      break;
    }
    case "technique": {
      const tech = ing?.type === "fish" ? "snacké unilatéral, peau croustillante" :
                   ing?.type === "meat" ? "rôti basse température, repos 10 minutes" :
                   ing?.type === "veg" ? "rôti entier au four à feu doux" : "travaillé à la minute";
      sentence = `${cap(main)} ${tech}${enrichedRest.length ? ", " + enrichedRest.join(", ") : ""}.`;
      break;
    }
    case "sensoriel": {
      const tex = ing?.type === "fish" ? "au cœur nacré" :
                  ing?.type === "meat" ? "fondant" :
                  ing?.type === "veg" ? "au cœur fondant, surface caramélisée" :
                  ing?.type === "cheese" ? "à la pâte onctueuse" : "fondant";
      sentence = `${cap(main)} ${tex}${enrichedRest.length ? ", " + enrichedRest.join(", ") : ""}, le velours en bouche dès la première bouchée.`;
      break;
    }
    case "contraste": {
      sentence = `${cap(main)}, cœur fondant et surface caramélisée${enrichedRest.length ? ", relevé par " + enrichedRest.join(", ") : ""}. Le contraste douceur-piquant surprend.`;
      break;
    }
    case "producteur": {
      const who = ing?.type === "fish" ? "pêché ce matin par notre marin" :
                  ing?.type === "meat" ? "élevé par la famille Martin" :
                  ing?.type === "cheese" ? "affiné chez notre fromager" :
                  "livré chaque matin par notre maraîcher";
      sentence = `${cap(main)} ${who}${enrichedRest.length ? ", " + enrichedRest.join(", ") : ""}.`;
      break;
    }
    case "transformation": {
      sentence = `${cap(main)} préparé sur 24 heures, mariné, cuit doucement puis dressé à la minute${enrichedRest.length ? ", avec " + enrichedRest.join(", ") : ""}.`;
      break;
    }
    case "rarete": {
      sentence = `${cap(main)}${enrichedRest.length ? ", " + enrichedRest.join(", ") : ""}. 8 portions ce midi seulement, arrivage du matin.`;
      break;
    }
    case "lecon": {
      sentence = `${cap(main)} saisi à feu vif — c'est ce qui scelle les sucs et garde la chair tendre${enrichedRest.length ? ", servi avec " + enrichedRest.join(", ") : ""}.`;
      break;
    }
  }

  // Nettoyage : répétitions de mots consécutifs et espaces
  sentence = sentence.replace(/\s+/g, " ").replace(/\s+,/g, ",").replace(/\b(\w+)(\s+\1\b)+/gi, "$1");

  // Limite à 25 mots
  const words = sentence.split(/\s+/);
  if (words.length > 25) {
    sentence = words.slice(0, 25).join(" ").replace(/[,;]$/, "") + ".";
  }

  return sentence;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
