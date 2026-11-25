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

    return new Response(JSON.stringify({ status: 'verified', payment: updated }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
