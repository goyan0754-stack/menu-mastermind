// api/stripe-webhook.js
// IMPORTANT: bodyParser doit etre desactive pour que Stripe puisse verifier la signature

import Stripe from 'stripe';
import getRawBody from 'raw-body';

const PRICE_7EUR = 'price_1TNuOhDXQzJdV5v7ksXZZJu0';
const PRICE_29EUR = 'price_1TNwXlDXQzJdV5v7iwk5oMe3';

// Desactiver le body parser Vercel - OBLIGATOIRE pour Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!STRIPE_SECRET || !WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Variables manquantes');
    return res.status(503).json({ error: 'Configuration manquante' });
  }

  const stripe = new Stripe(STRIPE_SECRET);

  // Lire le body brut AVANT toute autre operation
  let rawBody;
  try {
    rawBody = await getRawBody(req, { encoding: 'utf-8' });
  } catch (err) {
    console.error('Erreur lecture body:', err.message);
    return res.status(400).json({ error: 'Impossible de lire le body' });
  }

  // Verifier la signature Stripe
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature invalide:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('Webhook recu:', event.type);

  try {
    // Paiement ponctuel 7EUR
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_email || session.customer_details?.email;

      if (!email) {
        console.warn('Pas d email dans la session:', session.id);
        return res.status(200).json({ received: true });
      }

      // Verifier que c'est bien le produit 7EUR
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const is7EUR = lineItems.data.some(item => item.price?.id === PRICE_7EUR);

      if (is7EUR) {
        await addTokens(email, 2, 'unit', SUPABASE_URL, SUPABASE_KEY);
        console.log(`+2 tokens pour ${email} (7EUR ponctuel)`);
      }
    }

    // Renouvellement abonnement 29EUR/mois
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const email = invoice.customer_email;

      if (!email) {
        console.warn('Pas d email dans la facture:', invoice.id);
        return res.status(200).json({ received: true });
      }

      const is29EUR = invoice.lines?.data?.some(
        line => line.price?.id === PRICE_29EUR
      );

      if (is29EUR) {
        await addTokens(email, 30, 'abo', SUPABASE_URL, SUPABASE_KEY);
        console.log(`+30 tokens pour ${email} (29EUR abonnement)`);
      }
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Erreur traitement:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function addTokens(email, tokensToAdd, plan, SUPABASE_URL, SUPABASE_KEY) {
  const getRes = await fetch(
    `${SUPABASE_URL}/rest/v1/utilisateurs?email=eq.${encodeURIComponent(email)}&select=count,credits_bonus,plan`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  const users = await getRes.json();

  if (!users || users.length === 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/utilisateurs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email, plan, credits_bonus: tokensToAdd, count: 0 })
    });
    return;
  }

  const user = users[0];
  const currentCredits = Number(user.credits_bonus) || 0;
  const newCredits = plan === 'abo' ? 30 : currentCredits + tokensToAdd;

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
        plan,
        credits_bonus: newCredits,
        updated_at: new Date().toISOString()
      })
    }
  );
}
