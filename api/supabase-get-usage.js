// api/supabase-get-usage.js
// Remplace api/get-usage.js — vérifie l'état d'un utilisateur dans Supabase

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { email } = req.query;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(200).json({ exists: false });
  }

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/utilisateurs?email=eq.${encodeURIComponent(email)}&select=email,count,plan,credits_bonus,suspended`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!r.ok) return res.status(200).json({ exists: false });

    const data = await r.json();

    if (!data || data.length === 0) {
      return res.status(200).json({ exists: false });
    }

    const user = data[0];
    return res.status(200).json({
      exists: true,
      count: Number(user.count) || 0,
      plan: user.plan || null,
      credits_bonus: Number(user.credits_bonus) || 0,
      paid: user.plan && user.plan !== 'free' && user.plan !== 'suspended' ? true : false,
      suspended: user.suspended || false,
    });

  } catch (e) {
    console.error('supabase-get-usage error:', e.message);
    return res.status(200).json({ exists: false });
  }
}
