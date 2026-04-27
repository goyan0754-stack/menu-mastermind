// api/admin-update-user.js
// POST /api/admin-update-user
// Body JSON : { email, plan, credits_manuels }
// Envoie la mise à jour à Google Sheets via SHEETS_WEBHOOK_URL
// Appelé par UserModal dans AdminDash quand l'admin modifie un utilisateur.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(503).json({ error: 'SHEETS_WEBHOOK_URL non configuré' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Body JSON invalide' });
  }

  const { email, plan, credits_manuels } = body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  if (!plan) {
    return res.status(400).json({ error: 'Plan manquant' });
  }

  try {
    const r = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateUser',
        email,
        plan,
        credits_manuels: Number(credits_manuels) || 0,
        updated_by: 'admin',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!r.ok) {
      console.error('Sheets updateUser error:', r.status);
      return res.status(502).json({ error: `Sheets a retourné ${r.status}` });
    }

    return res.status(200).json({ success: true });

  } catch (e) {
    console.error('admin-update-user error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
