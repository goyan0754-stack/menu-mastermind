// api/admin-users.js
// GET /api/admin-users
// Appelle SHEETS_WEBHOOK_URL?action=getUsers côté serveur
// Retourne { users: [...] }
// Remplace le loadAdminData() qui appelait CONFIG.SHEETS_WEBHOOK depuis le frontend
// (la variable n'est plus dans CONFIG frontend pour des raisons de sécurité).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(503).json({ error: 'SHEETS_WEBHOOK_URL non configuré' });
  }

  try {
    const url = `${webhookUrl}?action=getUsers&t=${Date.now()}`;
    const r = await fetch(url);

    if (!r.ok) {
      console.error('Sheets getUsers error:', r.status);
      return res.status(502).json({ error: `Sheets a retourné ${r.status}` });
    }

    const data = await r.json();

    // L'Apps Script doit retourner { users: [...] }
    // Chaque utilisateur est un objet avec les colonnes de la feuille
    return res.status(200).json({ users: data.users || [] });

  } catch (e) {
    console.error('admin-users error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
