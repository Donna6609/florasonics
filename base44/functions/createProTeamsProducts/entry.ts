import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {};

    // Create Pro product + price ($13.99/month)
    const proProduct = await stripe.products.create({
      name: 'FloraSonics Pro',
      description: 'Pro monthly subscription to FloraSonics',
    });
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1399,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    results.pro = { product_id: proProduct.id, price_id: proPrice.id, amount: '$13.99/month' };

    // Create Teams product + price ($9.99/month)
    const teamsProduct = await stripe.products.create({
      name: 'FloraSonics Teams',
      description: 'Teams monthly subscription to FloraSonics',
    });
    const teamsPrice = await stripe.prices.create({
      product: teamsProduct.id,
      unit_amount: 999,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    results.teams = { product_id: teamsProduct.id, price_id: teamsPrice.id, amount: '$9.99/month' };

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});