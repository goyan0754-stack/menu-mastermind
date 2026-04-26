// api/admin-auth.js — Authentification admin sécurisée
// Le mot de passe admin est dans les variables d'environnement Vercel
// Jamais visible dans le code source côté client

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    // Fallback si la variable n'est pas configurée
    return res.status(500).json({ ok: false, error: 'Configuration admin manquante' });
  }

  if (!password || password !== adminPassword) {
    // Délai anti-bruteforce
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ ok: false });
  }

  return res.status(200).json({ ok: true });
}
