export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { email } = req.query;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email invalide' });

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return res.status(200).json({ exists: false });

  try {
    const url = `${webhookUrl}?action=getUser&email=${encodeURIComponent(email)}&t=${Date.now()}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(200).json({ exists: false });
    const data = await r.json();
    if (!data.found) return res.status(200).json({ exists: false });
    return res.status(200).json({
      exists: true,
      count: Number(data.count) || 0,
      plan: data.plan || null,
      credits_bonus: Number(data.credits_bonus) || 0,
      paid: data.plan && data.plan !== 'free' ? true : false,
    });
  } catch (e) {
    return res.status(200).json({ exists: false });
  }
}
