// api/supabase-log.js
// Remplace api/log.js — enregistre les données dans Supabase

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

  const { action, email, nom, resto, tel } = body;

  if (!email) return res.status(400).json({ error: 'Email requis' });

  try {
    if (action === 'signup') {
      // Vérifier si l'utilisateur existe déjà
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/utilisateurs?email=eq.${encodeURIComponent(email)}&select=email`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      const existing = await checkRes.json();

      if (!existing || existing.length === 0) {
        // Créer le nouvel utilisateur
        await fetch(`${SUPABASE_URL}/rest/v1/utilisateurs`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            email,
            nom: nom || '',
            resto: resto || '',
            telephone: tel || '',
            plan: 'free',
            count: 0,
            credits_bonus: 0,
          })
        });
      } else {
        // Mettre à jour la date si l'utilisateur existe
        await fetch(
          `${SUPABASE_URL}/rest/v1/utilisateurs?email=eq.${encodeURIComponent(email)}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ updated_at: new Date().toISOString() })
          }
        );
      }
    }

    if (action === 'generation') {
      // Incrémenter le compteur de générations
      const getRes = await fetch(
        `${SUPABASE_URL}/rest/v1/utilisateurs?email=eq.${encodeURIComponent(email)}&select=count,score_moyen`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      const userData = await getRes.json();

      if (userData && userData.length > 0) {
        const currentCount = userData[0].count || 0;
        const currentScore = userData[0].score_moyen || 0;
        const newScore = body.score_a || 0;
        const avgScore = currentCount > 0
          ? ((currentScore * currentCount) + newScore) / (currentCount + 1)
          : newScore;

        await fetch(
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
              count: currentCount + 1,
              score_moyen: Math.round(avgScore * 10) / 10,
              updated_at: new Date().toISOString()
            })
          }
        );
      }
    }

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error('supabase-log error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
