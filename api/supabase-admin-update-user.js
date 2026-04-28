// api/supabase-admin-update-user.js
// Remplace api/admin-update-user.js — met à jour dans Supabase

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: 'Supabase non configuré' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Body JSON invalide' });
  }

  const { email, plan, credits_manuels } = body;

  if (!email || !plan) {
    return res.status(400).json({ error: 'Email et plan requis' });
  }

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/utilisateurs?email=eq.${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          plan,
          credits_bonus: Number(credits_manuels) || 0,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!r.ok) {
      return res.status(502).json({ error: `Supabase erreur ${r.status}` });
    }

    return res.status(200).json({ success: true });

  } catch (e) {
    console.error('supabase-admin-update-user error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
