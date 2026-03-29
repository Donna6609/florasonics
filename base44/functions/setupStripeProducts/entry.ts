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

    // Create Basic product + price ($2.99/month)
    const basicProduct = await stripe.products.create({
      name: 'FloraSonics Basic',
      description: 'Basic monthly subscription to FloraSonics',
    });

    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 299, // $2.99 in cents
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    results.basic = {
      product_id: basicProduct.id,
      price_id: basicPrice.id,
      amount: '$2.99/month',
    };

    // Create Premium product + price ($7.99/month)
    const premiumProduct = await stripe.products.create({
      name: 'FloraSonics Premium',
      description: 'Premium monthly subscription to FloraSonics',
    });

    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 799, // $7.99 in cents
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    results.premium = {
      product_id: premiumProduct.id,
      price_id: premiumPrice.id,
      amount: '$7.99/month',
    };

    return Response.json({
      success: true,
      message: 'Products and prices created successfully. Update your secrets with the new Price IDs below.',
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});