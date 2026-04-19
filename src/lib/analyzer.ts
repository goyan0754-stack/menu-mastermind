export type AnalysisResult = {
  score: number;
  level: { label: string; tone: "exceptional" | "excellent" | "good" | "rewrite" };
  recommendations: string[];
  improved: string;
  breakdown: { label: string; delta: number }[];
};

const SENSORY = ["fondant", "fondante", "nacré", "nacrée", "crémeux", "crémeuse", "croquant", "croquante", "doré", "dorée", "vif", "vive", "moelleux", "moelleuse"];
const ORIGIN = ["ligne", "fermier", "fermière", "aop", "aoc", "producteur", "productrice", "bio", "local", "locale"];
const COOKING = ["basse température", "basse temperature", "poêlé", "poele", "poêlée", "rôti", "rotie", "rôtie", "roti", "confit", "confite", "braisé", "braisée", "snacké", "snackée", "grillé", "grillée", "fumé", "fumée"];
const EMPTY = ["délicieux", "delicieux", "délicieuse", "bon", "bonne", "superbe", "excellent", "excellente", "savoureux", "savoureuse"];

const ADJ_HINT = /(é|ée|és|ées|eux|euse|ant|ante|if|ive|al|ale)\b/i;

// Ingrédients connus avec catégorie + suggestion de cuisson/contexte
type IngredientInfo = {
  key: string;
  match: RegExp;
  type: "fish" | "meat" | "veg" | "starch" | "sauce" | "cheese";
  display: string;
  cookingTip?: string;
  originTip?: string;
  textureTip?: string;
};

const INGREDIENTS: IngredientInfo[] = [
  // Poissons
  { key: "cabillaud", match: /\bcabillaud\b/i, type: "fish", display: "cabillaud",
    originTip: "Précisez l'origine du cabillaud (de ligne, port d'attache, région). Les clients paient plus cher pour du poisson tracé.",
    cookingTip: "Dites comment le cabillaud est cuit : basse température, poêlé, rôti. Un mot de cuisson vend mieux.",
    textureTip: "Décrivez la chair : 'cabillaud nacré' ou 'au cœur fondant' donne envie." },
  { key: "saumon", match: /\bsaumon\b/i, type: "fish", display: "saumon",
    originTip: "Précisez l'origine du saumon (Écosse, Norvège, Label Rouge, bio).",
    cookingTip: "Indiquez la cuisson : mi-cuit, gravlax, basse température, snacké.",
    textureTip: "Évoquez la texture nacrée ou fondante du saumon." },
  { key: "thon", match: /\bthon\b/i, type: "fish", display: "thon",
    originTip: "Précisez l'espèce et l'origine (thon rouge de ligne, germon Atlantique).",
    cookingTip: "Dites mi-cuit, snacké unilatéral ou tataki — la cuisson change tout.",
    textureTip: "Décrivez la couleur grenat et la texture fondante." },
  { key: "bar", match: /\bbar\b/i, type: "fish", display: "bar",
    originTip: "Précisez 'bar de ligne' ou 'bar sauvage' pour valoriser la pêche.",
    cookingTip: "Indiquez la cuisson : à la plancha, en croûte de sel, rôti sur peau.",
    textureTip: "Mentionnez la peau croustillante et la chair nacrée." },
  // Viandes
  { key: "boeuf", match: /\b(boeuf|bœuf)\b/i, type: "meat", display: "bœuf",
    originTip: "Précisez la race et l'origine (Charolais, Limousine, Black Angus, fermier).",
    cookingTip: "Indiquez la cuisson souhaitée et le mode (grillé, snacké, rôti basse température).",
    textureTip: "Évoquez la tendreté ou le persillé de la viande." },
  { key: "agneau", match: /\bagneau\b/i, type: "meat", display: "agneau",
    originTip: "Précisez l'origine (Sisteron AOP, Pauillac, Aveyron).",
    cookingTip: "Dites confit 7 heures, rôti rosé, ou braisé pour valoriser la cuisson.",
    textureTip: "Évoquez la chair fondante qui se détache à la fourchette." },
  { key: "poulet", match: /\bpoulet\b/i, type: "meat", display: "poulet",
    originTip: "Précisez 'poulet fermier', 'Label Rouge' ou l'origine (Bresse, Landes).",
    cookingTip: "Indiquez rôti, basse température, ou en cocotte.",
    textureTip: "Mentionnez la peau dorée et croustillante, la chair moelleuse." },
  { key: "canard", match: /\bcanard\b/i, type: "meat", display: "canard",
    originTip: "Précisez l'origine (canard du Sud-Ouest, IGP).",
    cookingTip: "Dites confit, magret rosé, ou laqué.",
    textureTip: "Évoquez la peau croustillante et la chair fondante." },
  { key: "porc", match: /\bporc\b/i, type: "meat", display: "porc",
    originTip: "Précisez l'origine (Noir de Bigorre, fermier, Label Rouge).",
    cookingTip: "Dites basse température 12h, confit, ou rôti.",
    textureTip: "Mentionnez la chair fondante qui se défait." },
  // Légumes
  { key: "chou-fleur", match: /\bchou[- ]fleur\b/i, type: "veg", display: "chou-fleur",
    cookingTip: "Précisez la cuisson : 'chou-fleur braisé à feu doux, cœur fondant' ou 'rôti entier au four'.",
    textureTip: "Ajoutez une phrase sur le contraste. Exemple : 'Le croquant du chou-fleur caramélisé et le fondant de l'intérieur.'",
    originTip: "Précisez 'chou-fleur du maraîcher' ou 'de saison' pour valoriser." },
  { key: "courgette", match: /\bcourgette/i, type: "veg", display: "courgette",
    cookingTip: "Précisez : grillée à la plancha, confite à l'huile d'olive, ou en fleur farcie.",
    textureTip: "Évoquez la texture fondante ou le croquant selon la cuisson.",
    originTip: "Précisez 'courgette du producteur' ou 'de plein champ'." },
  { key: "aubergine", match: /\baubergine/i, type: "veg", display: "aubergine",
    cookingTip: "Dites grillée au feu de bois, confite, ou rôtie entière.",
    textureTip: "Mentionnez la chair fondante et fumée.",
    originTip: "Précisez 'aubergine du Sud' ou 'de saison'." },
  { key: "champignon", match: /\bchampignon/i, type: "veg", display: "champignons",
    cookingTip: "Dites poêlés au beurre, rôtis, ou en duxelles.",
    textureTip: "Évoquez la texture charnue et le parfum boisé.",
    originTip: "Précisez la variété (cèpes, girolles, shiitakés) et l'origine (cueillette, forêt)." },
  { key: "legumes", match: /\bl[ée]gumes?\b/i, type: "veg", display: "légumes",
    cookingTip: "Remplacez 'légumes' par les noms précis (carottes glacées, fenouil rôti, panais).",
    textureTip: "Précisez la texture : 'légumes croquants', 'fondants', 'rôtis au four'.",
    originTip: "Dites 'légumes du marché' ou 'du producteur local' pour rassurer." },
  // Féculents
  { key: "riz", match: /\briz\b/i, type: "starch", display: "riz",
    textureTip: "Remplacez 'riz' par 'risotto crémeux', 'riz sauvage croquant' ou 'riz vénéré'. Donnez une texture.",
    cookingTip: "Précisez le mode : pilaf, risotto, vapeur thaï.",
    originTip: "Précisez la variété (Carnaroli, Basmati, Camargue IGP)." },
  { key: "pates", match: /\bp[âa]tes?\b/i, type: "starch", display: "pâtes",
    textureTip: "Précisez la forme (tagliatelles, raviolis, gnocchis) et 'al dente'.",
    cookingTip: "Dites 'fraîches maison' ou 'extrudées au bronze' si c'est le cas.",
    originTip: "Mentionnez 'pâtes fraîches maison' pour valoriser le travail." },
  { key: "pommes-de-terre", match: /\bpommes?[- ]de[- ]terre\b|\bpdt\b/i, type: "starch", display: "pommes de terre",
    textureTip: "Précisez : 'écrasée à l'huile d'olive', 'fondantes', 'rattes confites'.",
    cookingTip: "Dites confites, écrasées, en mousseline ou rôties.",
    originTip: "Précisez la variété (ratte, BF15, charlotte) et l'origine." },
  { key: "purée", match: /\bpur[ée]e\b/i, type: "starch", display: "purée",
    textureTip: "Évoquez l'onctuosité : 'purée crémeuse au beurre noisette'.",
    cookingTip: "Précisez le mode (à la fourchette, mousseline, écrasée).",
    originTip: "Précisez la variété de pomme de terre utilisée." },
  // Sauces
  { key: "chimichurri", match: /\bchimichurri\b/i, type: "sauce", display: "chimichurri",
    textureTip: "Décrivez votre chimichurri : ail, persil frais, piment doux, huile d'olive. Les clients aiment savoir ce qu'il y a dedans.",
    cookingTip: "Précisez 'chimichurri maison' pour valoriser le travail.",
    originTip: "Mentionnez l'origine argentine pour le storytelling." },
  { key: "jus", match: /\bjus\b/i, type: "sauce", display: "jus",
    textureTip: "Décrivez le jus : corsé, réduit, lié au beurre, parfumé au thym.",
    cookingTip: "Précisez 'jus monté au beurre' ou 'réduit longuement'.",
    originTip: "Dites 'jus de viande maison' pour valoriser." },
  // Fromages
  { key: "fromage", match: /\bfromage/i, type: "cheese", display: "fromage",
    originTip: "Précisez le nom du fromage et l'AOP (Comté 24 mois, Saint-Nectaire fermier).",
    textureTip: "Évoquez le caractère : crémeux, affiné, persillé.",
    cookingTip: "Si fondu/gratiné, précisez-le." },
];

function detectIngredients(text: string): IngredientInfo[] {
  const found: IngredientInfo[] = [];
  for (const ing of INGREDIENTS) {
    if (ing.match.test(text)) found.push(ing);
  }
  return found;
}

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

  const ingredients = detectIngredients(text);
  const recommendations = buildRecommendations(text, ingredients, {
    sensory: !!sensory,
    origin: !!origin,
    cooking: !!cooking,
    empty,
    tooShort: words.length < 5,
  });

  const improved = improve(text, ingredients, { sensory: !!sensory, origin: !!origin, cooking: !!cooking });

  return { score, level, recommendations: recommendations.slice(0, 3), improved, breakdown };
}

function buildRecommendations(
  text: string,
  ingredients: IngredientInfo[],
  ctx: { sensory: boolean; origin: boolean; cooking: boolean; empty: string | null; tooShort: boolean }
): string[] {
  const recs: string[] = [];
  const usedTypes = new Set<string>();

  // Priorité 1 : recommandations spécifiques aux ingrédients détectés
  // On essaie de couvrir : cuisson, origine/sauce, texture
  const needCooking = !ctx.cooking;
  const needOrigin = !ctx.origin;
  const needSensory = !ctx.sensory;

  // Étape 1 : recommandation cuisson sur l'ingrédient principal si manquante
  if (needCooking) {
    const ing = ingredients.find((i) => i.cookingTip && (i.type === "fish" || i.type === "meat" || i.type === "veg"));
    if (ing?.cookingTip) {
      recs.push(ing.cookingTip);
      usedTypes.add(ing.key);
    }
  }

  // Étape 2 : recommandation origine sur poisson/viande/fromage si manquante
  if (needOrigin && recs.length < 3) {
    const ing = ingredients.find((i) => !usedTypes.has(i.key) && i.originTip && (i.type === "fish" || i.type === "meat" || i.type === "cheese"));
    if (ing?.originTip) {
      recs.push(ing.originTip);
      usedTypes.add(ing.key);
    }
  }

  // Étape 3 : recommandation sur sauce ou féculent (souvent générique → à enrichir)
  if (recs.length < 3) {
    const sauceOrStarch = ingredients.find((i) => !usedTypes.has(i.key) && (i.type === "sauce" || i.type === "starch" || i.type === "veg"));
    if (sauceOrStarch?.textureTip) {
      recs.push(sauceOrStarch.textureTip);
      usedTypes.add(sauceOrStarch.key);
    }
  }

  // Étape 4 : recommandation texture/sensoriel sur ingrédient restant
  if (needSensory && recs.length < 3) {
    const ing = ingredients.find((i) => !usedTypes.has(i.key) && i.textureTip);
    if (ing?.textureTip) {
      recs.push(ing.textureTip);
      usedTypes.add(ing.key);
    }
  }

  // Étape 5 : si mot vide détecté, suggérer de le remplacer
  if (ctx.empty && recs.length < 3) {
    recs.push(`Remplacez le mot "${ctx.empty}" par une description concrète : texture, cuisson ou ingrédient précis.`);
  }

  // Étape 6 : si trop court
  if (ctx.tooShort && recs.length < 3) {
    recs.push("Étoffez la description : visez 8 à 15 mots qui racontent vraiment le plat (cuisson, texture, accompagnement).");
  }

  // Étape 7 : fallbacks génériques mais ciblés selon ce qui manque
  const fallbacks: string[] = [];
  if (needCooking) fallbacks.push("Indiquez un mode de cuisson précis (basse température, poêlé, rôti, confit, braisé) pour montrer votre savoir-faire.");
  if (needOrigin) fallbacks.push("Précisez l'origine ou la provenance (de ligne, fermier, AOP, du producteur) pour rassurer et valoriser.");
  if (needSensory) fallbacks.push("Ajoutez un mot sensoriel (fondant, nacré, crémeux, croquant, doré) pour faire saliver le lecteur.");
  fallbacks.push("Ajoutez une garniture ou un accompagnement signature qui différencie votre plat.");
  fallbacks.push("Précisez la texture finale en bouche pour transporter le client avant la première bouchée.");

  for (const f of fallbacks) {
    if (recs.length >= 3) break;
    if (!recs.includes(f)) recs.push(f);
  }

  return recs;
}

function improve(text: string, ingredients: IngredientInfo[], has: { sensory: boolean; origin: boolean; cooking: boolean }): string {
  // Nettoyer la base : supprimer ponctuation finale, espaces multiples
  let base = text.trim().replace(/[.;]+$/, "").replace(/\s+/g, " ");

  // Découper en segments par virgules pour traiter chaque élément
  const segments = base.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return text;

  // Premier segment = élément principal (souvent le poisson/viande/légume)
  const main = segments[0];
  const rest = segments.slice(1);

  const mainLower = main.toLowerCase();
  const mainIngredient = ingredients.find((i) => i.match.test(main));

  // Construire le segment principal enrichi
  let enrichedMain = main;
  const mainAdditions: string[] = [];

  if (!has.cooking && mainIngredient) {
    // Choisir une cuisson plausible selon le type
    if (mainIngredient.type === "fish") mainAdditions.push("poêlé");
    else if (mainIngredient.type === "meat") mainAdditions.push("rôti basse température");
    else if (mainIngredient.type === "veg" && !/braisé|rôti|grillé|confit/i.test(mainLower)) mainAdditions.push("rôti");
  }

  if (!has.origin && mainIngredient) {
    if (mainIngredient.type === "fish") mainAdditions.push("de ligne");
    else if (mainIngredient.type === "meat") mainAdditions.push("fermier");
    else if (mainIngredient.type === "veg") mainAdditions.push("du marché");
  }

  if (!has.sensory && mainIngredient) {
    if (mainIngredient.type === "fish") mainAdditions.push("au cœur nacré");
    else if (mainIngredient.type === "meat") mainAdditions.push("fondant");
    else if (mainIngredient.type === "veg") mainAdditions.push("au cœur fondant");
  }

  if (mainAdditions.length > 0) {
    // Filtrer les additions qui dupliquent un mot déjà présent
    const dedup = mainAdditions.filter((add) => {
      const firstWord = add.split(/\s+/)[0].toLowerCase().replace(/[éè]/g, "e");
      const baseLower = base.toLowerCase().replace(/[éè]/g, "e");
      return !new RegExp(`\\b${firstWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(baseLower);
    });
    if (dedup.length > 0) {
      enrichedMain = `${main} ${dedup.join(", ")}`;
    }
  }

  // Enrichir les segments restants : remplacer les termes trop génériques
  const enrichedRest = rest.map((seg) => {
    const lower = seg.toLowerCase().trim();
    if (/^l[ée]gumes?$/.test(lower)) return "légumes du moment croquants";
    if (/^riz$/.test(lower)) return "riz crémeux";
    if (/^pur[ée]e$/.test(lower)) return "purée onctueuse";
    if (/^pommes?[- ]de[- ]terre$/.test(lower)) return "pommes de terre fondantes";
    return seg;
  });

  // Reconstruire la phrase
  const parts = [enrichedMain, ...enrichedRest];
  let sentence = parts.join(", ");

  // Capitaliser
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

  // Limiter à ~25 mots : si trop long, on garde tel quel sans phrase finale
  const wordCount = sentence.split(/\s+/).length;
  if (wordCount < 20) {
    sentence += ".";
  } else {
    sentence += ".";
  }

  // Supprimer répétitions de mots consécutifs (ex: "rôti rôti")
  sentence = sentence.replace(/\b(\w+)(\s+\1)+\b/gi, "$1");

  return sentence;
}
