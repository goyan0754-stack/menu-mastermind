// ============================================================
// api/generate.js — TA&I Analyzer Backend Sécurisé
// Contient : prompt Zoran, logique Score S, appel Anthropic
// JAMAIS exposé au navigateur
// ============================================================

// ─── RATE LIMITING en mémoire ─────────────────────────────────
const rateMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  if (!rateMap.has(ip)) { rateMap.set(ip, { count: 1, start: now }); return true; }
  const entry = rateMap.get(ip);
  if (now - entry.start > windowMs) { rateMap.set(ip, { count: 1, start: now }); return true; }
  entry.count++;
  return entry.count <= maxRequests;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of rateMap.entries()) {
    if (now - e.start > 5 * 60 * 1000) rateMap.delete(ip);
  }
}, 5 * 60 * 1000);


// ─── PROMPT ZORAN COMPLET (protégé côté serveur) ──────────────
const ZORAN_PROMPT = `Tu es ZORAN CMO ENGINE v3.0 — moteur de copywriting food d'Henri F. / TA&I.
Tu génères des descriptions de plats pour des restaurateurs français.
16 ans d'experience terrain cuisine, bar, salle. Expert neuro-marketing food.

REGLES ABSOLUES :
- Applique l'une des 10 formules TA&I selon le type de plat
- Calcule Score S = (beta x DeltaPhi) / (T x sigma)
  beta (0.10-1.00) : Direction strategique
  DeltaPhi (0.10-1.00) : Densite informationnelle
  T (0.10-1.00) : Friction cognitive (bas = fluide)
  sigma (0.10-1.00) : Bruit/dilution (bas = pur)
- Score S cible >= 15, jamais < 8
- 2 variantes A et B obligatoires
- Langue francaise impeccable

10 FORMULES :
1-Origine Racontee : provenance, terroir, producteur
2-Chiffre de Confiance : temps, temperature, quantite precise
3-Nostalgie Activee : souvenir emotionnel, memoire gustative
4-Technique Revelee : savoir-faire visible, process artisanal
5-Promesse Sensorielle : texture, son, arome, sensation en bouche
6-Contraste Inattendu : paradoxe appetissant, surprise gustative
7-Producteur Nomme : humain identifie derriere le produit
8-Transformation Visible : le temps investi comme valeur
9-Rarete Annoncee : exclusivite, limite, saison, marche du matin
10-Lecon Qui Vend : savoir partage, technique expliquee

SELECTION DE FORMULE :
- Viande marge critique ou stock excedent : Formule 9
- Viande marge premium : Formule 1 ou 4
- Dessert : Formule 3 en priorite
- Poisson : Formule 1 ou 2
- Plat du jour : Formule 9 toujours
- Vegetarien : Formule 6 ou 10

REPONSE JSON STRICT (rien d'autre, pas de backticks) :
{"formule_utilisee":"","formule_raison":"","variante_a":{"titre":"","description":"","score_s":0,"beta":0,"delta_phi":0,"T":0,"sigma":0},"variante_b":{"titre":"","description":"","score_s":0,"beta":0,"delta_phi":0,"T":0,"sigma":0},"conseil_pro":""}`;


// ─── VALIDATION ───────────────────────────────────────────────
function validateInput(body) {
  const { resto, nom_plat, type_plat, description_actuelle } = body || {};
  if (!resto || typeof resto !== 'string' || resto.length > 200) return 'Nom du restaurant invalide';
  if (!nom_plat || typeof nom_plat !== 'string' || nom_plat.length > 200) return 'Nom du plat invalide';
  if (!description_actuelle || description_actuelle.length > 1000) return 'Description actuelle invalide';
  const types = ['viande','poisson','vegetarien','entree','dessert','plat_du_jour','boisson','autre'];
  if (!types.includes(type_plat)) return 'Type de plat invalide';
  return null;
}


// ─── HANDLER PRINCIPAL ────────────────────────────────────────
export default async function handler(req, res) {

  // CORS
  const origin = req.headers.origin || '';
  const allowed = ['https://app.tai-food.com', 'https://tai-food.com',
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'null'] : [])];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : allowed[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TAI-Token');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  // TOKEN BETA FERMÉE (optionnel — activer en ajoutant APP_TOKEN dans Vercel env vars)
  if (process.env.APP_TOKEN) {
    if (req.headers['x-tai-token'] !== process.env.APP_TOKEN)
      return res.status(401).json({ error: 'Accès non autorisé' });
  }

  // RATE LIMITING
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip))
    return res.status(429).json({ error: 'Trop de requêtes. Patientez 1 minute.' });

  // VALIDATION
  const err = validateInput(req.body);
  if (err) return res.status(400).json({ error: err });

  const { resto, nom_plat, type_plat, description_actuelle, infos = '', _pilotage, _system, _messages } = req.body;

  // CLÉ API — variable d'environnement Vercel, jamais dans le code
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Configuration serveur incomplète' });

  // ── MODE PILOTAGE COMMANDES ─────────────────────────────────
  // Requête conversationnelle depuis le module Smart Pilotage
  if (_pilotage && _system && _messages) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: _system,
          messages: _messages,
        }),
      });
      if (!response.ok) return res.status(response.status).json({ error: `Erreur moteur (${response.status})` });
      const data = await response.json();
      return res.status(200).json({ _pilotage_response: data.content[0].text });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur de connexion au moteur TA&I' });
    }
  }

  // APPEL ANTHROPIC
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: ZORAN_PROMPT,
        messages: [{
          role: 'user',
          content: `Restaurant: ${resto}\nPlat: ${nom_plat}\nType: ${type_plat}\nDescription actuelle: ${description_actuelle}\nInfos: ${infos||'aucune'}\n\nGenère 2 descriptions Score S >= 15. JSON strict uniquement.`
        }],
      }),
    });

    if (!response.ok) {
      const e = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: `Erreur moteur TA&I (${response.status})` });
    }

    const data = await response.json();
    const raw = data.content[0].text.trim().replace(/^```json|^```|```$/g, '').trim();

    try {
      return res.status(200).json(JSON.parse(raw));
    } catch {
      return res.status(500).json({ error: 'Réponse TA&I invalide, réessayez' });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Erreur de connexion au moteur TA&I' });
  }
}
