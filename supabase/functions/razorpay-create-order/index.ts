// Supabase Edge Function: Create Razorpay Order (Server-Side Secrets Only)
// Deploy with: npx supabase functions deploy razorpay-create-order
// Required Edge Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing Authorization' }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const rzpKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const rzpKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const adminClient = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders });
    }

    const { planCode, billingCycle, couponCode, idempotencyKey, consentConfirmed } = await req.json();
    if (!consentConfirmed) {
      return new Response(JSON.stringify({ error: 'Customer payment consent is required.' }), { status: 400, headers: corsHeaders });
    }

    // Idempotency check
    const { data: existing } = await adminClient
      .from('payments')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ payment: existing, keyId: rzpKeyId }), { status: 200, headers: corsHeaders });
    }

    const { data: plan, error: planErr } = await adminClient
      .from('plans')
      .select('*')
      .eq('code', planCode)
      .eq('is_active', true)
      .single();
    if (planErr || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: corsHeaders });
    }

    const baseAmount = billingCycle === 'ANNUAL' ? Number(plan.annual_price_inr) : Number(plan.monthly_price_inr);
    let discountAmount = 0;
    if (couponCode) {
      const { data: coupon } = await adminClient
        .from('promotional_coupons')
        .select('*')
        .eq('code', String(couponCode).toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      if (coupon) {
        discountAmount =
          coupon.discount_type === 'PERCENT'
            ? Number(((baseAmount * Number(coupon.discount_value)) / 100).toFixed(2))
            : Math.min(baseAmount, Number(coupon.discount_value));
      }
    }

    const taxable = Math.max(0, baseAmount - discountAmount);
    const taxAmount = Number((taxable * 0.18).toFixed(2));
    const totalAmount = Number((taxable + taxAmount).toFixed(2));
    const amountPaise = Math.round(totalAmount * 100);

    const basicAuth = btoa(`${rzpKeyId}:${rzpKeySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      }),
    });
    const rzpOrder = await rzpRes.json();
    if (!rzpRes.ok) {
      return new Response(JSON.stringify({ error: rzpOrder?.error?.description || 'Razorpay order failed' }), { status: 502, headers: corsHeaders });
    }

    const { data: payment, error: payErr } = await adminClient
      .from('payments')
      .insert({
        user_id: userData.user.id,
        purpose: 'SUBSCRIPTION',
        razorpay_order_id: rzpOrder.id,
        idempotency_key: idempotencyKey,
        base_amount_inr: baseAmount,
        discount_amount_inr: discountAmount,
        tax_amount_inr: taxAmount,
        total_amount_inr: totalAmount,
        status: 'CREATED',
        consent_confirmed: true,
        metadata: { planCode, billingCycle },
      })
      .select('*')
      .single();

    if (payErr) throw payErr;
    return new Response(JSON.stringify({ payment, order: rzpOrder, keyId: rzpKeyId }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
