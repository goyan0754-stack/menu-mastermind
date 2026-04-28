// api/supabase-admin-users.js
// Remplace api/admin-users.js — lit depuis Supabase

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: 'Supabase non configuré' });
  }

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/utilisateurs?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!r.ok) {
      return res.status(502).json({ error: `Supabase erreur ${r.status}` });
    }

    const data = await r.json();

    // Formater pour le dashboard admin existant
    const users = data.map(u => ({
      Email: u.email,
      Nom: u.nom || '',
      Restaurant: u.resto || '',
      Telephone: u.telephone || '',
      'Nb requetes': u.count || 0,
      'Total depense': u.total_depense || 0,
      Plan: u.plan || 'free',
      'Score moyen': u.score_moyen || 0,
      'Credits manuels': u.credits_bonus || 0,
      'Derniere activite': u.updated_at ? new Date(u.updated_at).toLocaleDateString('fr-FR') : '',
    }));

    return res.status(200).json({ users });

  } catch (e) {
    console.error('supabase-admin-users error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
