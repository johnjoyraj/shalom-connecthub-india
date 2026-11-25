// Supabase Edge Function: Scheduled Automation & Official WhatsApp Cloud API Worker
// Uses Meta Graph API v21.0 Official Business Platform ONLY (never browser automation).
// Required Edge Secrets: SUPABASE_SERVICE_ROLE_KEY, WHATSAPP_PHONE_ID, WHATSAPP_API_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

async function sendOfficialWhatsAppTemplate(
  phoneId: string,
  accessToken: string,
  toPhoneDigits: string,
  templateName: string,
  params: string[]
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const res = await fetch(`${GRAPH_API_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhoneDigits,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: params.map((text) => ({ type: 'text', text })),
          },
        ],
      },
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    return { ok: false, error: body?.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, messageId: body?.messages?.[0]?.id };
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const waPhoneId = Deno.env.get('WHATSAPP_PHONE_ID') || '';
  const waToken = Deno.env.get('WHATSAPP_API_TOKEN') || '';

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: jobs } = await admin
    .from('automation_jobs')
    .select('*')
    .in('status', ['PENDING', 'RETRYING'])
    .lte('next_run_at', new Date().toISOString())
    .limit(20);

  let processed = 0;
  for (const job of jobs ?? []) {
    try {
      const payload = job.payload as Record<string, unknown>;
      if (job.job_type === 'WHATSAPP_NOTIFY' && waPhoneId && waToken) {
        const phone = String(payload.phone || '').replace(/\D/g, '');
        const template = String(payload.template || 'new_enquiry_alert');
        const result = await sendOfficialWhatsAppTemplate(waPhoneId, waToken, phone, template, [
          String(payload.param1 || 'ConnectHub'),
        ]);
        if (!result.ok) throw new Error(result.error);
      }

      await admin
        .from('automation_jobs')
        .update({ status: 'COMPLETED', attempts: job.attempts + 1 })
        .eq('id', job.id);
      processed += 1;
    } catch (err) {
      const nextAttempts = Number(job.attempts) + 1;
      const exhausted = nextAttempts >= Number(job.max_attempts || 3);
      await admin
        .from('automation_jobs')
        .update({
          status: exhausted ? 'FAILED' : 'RETRYING',
          attempts: nextAttempts,
          last_error: String(err),
          next_run_at: new Date(Date.now() + nextAttempts * 5 * 60 * 1000).toISOString(),
        })
        .eq('id', job.id);
    }
  }

  return new Response(JSON.stringify({ processed }), { status: 200 });
});
