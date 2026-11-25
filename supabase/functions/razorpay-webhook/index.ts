// Supabase Edge Function: Idempotent Razorpay Webhook Handler
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-Razorpay-Signature') ?? '';
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
    const expected = await hmacSha256Hex(webhookSecret, rawBody);

    if (!signature || expected !== signature) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const paymentEntity = event?.payload?.payment?.entity;
    if (event.event === 'payment.captured' && paymentEntity?.order_id) {
      const { data: existing } = await adminClient
        .from('payments')
        .select('id, status')
        .eq('razorpay_order_id', paymentEntity.order_id)
        .maybeSingle();

      // Idempotent guard: do nothing if already SUCCEEDED
      if (existing && existing.status !== 'SUCCEEDED') {
        await adminClient
          .from('payments')
          .update({
            razorpay_payment_id: paymentEntity.id,
            razorpay_signature_verified: true,
            status: 'SUCCEEDED',
          })
          .eq('id', existing.id);
      }
    } else if (event.event === 'payment.failed' && paymentEntity?.order_id) {
      await adminClient
        .from('payments')
        .update({
          status: 'FAILED',
          failure_reason: paymentEntity.error_description || 'Razorpay payment failed',
        })
        .eq('razorpay_order_id', paymentEntity.order_id)
        .neq('status', 'SUCCEEDED');
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
