// Supabase Edge Function: Verify Razorpay Payment Signature & Activate Subscription
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const rzpKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    const expectedSig = await hmacSha256Hex(rzpKeySecret, `${razorpay_order_id}|${razorpay_payment_id}`);

    if (expectedSig !== razorpay_signature) {
      await adminClient
        .from('payments')
        .update({ status: 'FAILED', failure_reason: 'Invalid Razorpay signature' })
        .eq('razorpay_order_id', razorpay_order_id);
      return new Response(JSON.stringify({ error: 'Signature verification failed' }), { status: 400, headers: corsHeaders });
    }

    const { data: payment } = await adminClient
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (!payment) return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404, headers: corsHeaders });
    if (payment.status === 'SUCCEEDED') {
      return new Response(JSON.stringify({ status: 'already_verified', payment }), { status: 200, headers: corsHeaders });
    }

    const { data: updated } = await adminClient
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature_verified: true,
        status: 'SUCCEEDED',
      })
      .eq('id', payment.id)
      .select('*')
      .single();

    // Activate subscription server-side if payment is for SUBSCRIPTION
    let subscription = null;
    const meta = (payment.metadata ?? {}) as Record<string, string>;
    const planCode = meta.plan_code ?? meta.planCode;
    const billingCycle = meta.billing_cycle ?? meta.billingCycle ?? 'MONTHLY';
    if (payment.purpose === 'SUBSCRIPTION' && planCode) {
      const { data: plan } = await adminClient.from('plans').select('*').eq('code', planCode).maybeSingle();
      if (plan) {
        await adminClient
          .from('subscriptions')
          .update({ status: 'EXPIRED' })
          .eq('user_id', payment.user_id)
          .eq('status', 'ACTIVE');
        const startsAt = new Date();
        const days = billingCycle === 'ANNUAL' ? 365 : 30;
        const expiresAt = new Date(startsAt.getTime() + days * 86400000);
        const { data: sub } = await adminClient
          .from('subscriptions')
          .insert({
            user_id: payment.user_id,
            plan_id: plan.id,
            billing_cycle: billingCycle,
            status: 'ACTIVE',
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            auto_renew_authorized: false,
            last_reminder_stage: 'NONE',
          })
          .select('*')
          .single();
        subscription = sub;
        if (sub) {
          await adminClient.from('payments').update({ subscription_id: sub.id }).eq('id', payment.id);
        }
      }
    }

    // Issue GST invoice server-side if paid > 0
    let invoice = null;
    if (Number(payment.total_amount_inr) > 0) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name')
        .eq('id', payment.user_id)
        .maybeSingle();
      const customerState = String(meta.customer_state_code || 'UP').toUpperCase();
      const taxable = Math.max(0, Number(payment.base_amount_inr) - Number(payment.discount_amount_inr));
      const intra = customerState === 'UP';
      const gstTotal = Number((taxable * 0.18).toFixed(2));
      const cgst = intra ? Number((gstTotal / 2).toFixed(2)) : 0;
      const sgst = intra ? Number((gstTotal - cgst).toFixed(2)) : 0;
      const igst = intra ? 0 : gstTotal;
      const { data: inv } = await adminClient
        .from('invoices')
        .insert({
          invoice_number: `SCHI-2026-${Date.now().toString().slice(-6)}`,
          payment_id: payment.id,
          user_id: payment.user_id,
          customer_name: profile?.full_name || 'Customer',
          customer_state_code: customerState,
          supplier_state_code: 'UP',
          tax_type: intra ? 'INTRA_STATE' : 'INTER_STATE',
          taxable_amount_inr: taxable,
          cgst_inr: cgst,
          sgst_inr: sgst,
          igst_inr: igst,
          total_amount_inr: Number(payment.total_amount_inr),
          amount_in_words: `Rupees ${Math.round(Number(payment.total_amount_inr))} Only`,
          status: 'ISSUED',
        })
        .select('*')
        .maybeSingle();
      invoice = inv;
    }

    return new Response(
      JSON.stringify({ status: 'verified', payment: updated, subscription, invoice }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
