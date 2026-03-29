import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { downloadId, successUrl, cancelUrl } = await req.json();

    if (!downloadId) {
      return Response.json({ error: 'Download ID required' }, { status: 400 });
    }

    const priceId = Deno.env.get("STRIPE_DOWNLOAD_PRICE_ID");
    if (!priceId) {
      console.error("STRIPE_DOWNLOAD_PRICE_ID not set");
      return Response.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.get('origin')}?download_success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}?download_cancelled=true`,
      client_reference_id: user.email,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        download_id: downloadId,
        user_email: user.email,
      },
    });

    return Response.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Download checkout error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});