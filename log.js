// ============================================================
// api/log.js — Proxy sécurisé Google Sheets
// L'URL du webhook est cachée côté serveur
// ============================================================

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return res.status(200).json({ ok: true }); // silencieux si non configuré

  const allowedActions = ['signup', 'generation', 'payment', 'payment_intent', 'admin_update'];
  const { action } = req.body || {};
  if (!allowedActions.includes(action)) return res.status(400).json({ error: 'Action invalide' });

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, timestamp: new Date().toISOString() }),
    });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(200).json({ ok: true }); // ne pas bloquer l'app si Sheets est down
  }
}
