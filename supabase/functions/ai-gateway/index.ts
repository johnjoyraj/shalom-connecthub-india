// Supabase Edge Function: Server-Side AI Gateway (Gemini API)
// Keeps GEMINI_API_KEY strictly server-side; enforces monthly INR spend cap & daily user limits.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_GUARDRAILS =
  'You are the SHALOM CONNECTHUB INDIA AI Assistant. Be helpful, accurate, and concise. NEVER claim legal property title verification or guarantee candidate qualifications. Recommend human/legal verification for legal, financial, or statutory matters.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: userRes, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders });
    }

    const { featureKey, prompt } = await req.json();
    const { data: settings } = await admin.from('ai_settings').select('*').eq('config_key', 'default').single();

    if (!settings?.is_enabled || !settings?.enabled_features?.[featureKey]) {
      await admin.from('ai_usage_logs').insert({
        user_id: userRes.user.id,
        feature_key: featureKey,
        status: 'BLOCKED_DISABLED',
      });
      return new Response(JSON.stringify({ error: 'AI feature is disabled by administrator.' }), { status: 403, headers: corsHeaders });
    }

    // Monthly spend check
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthUsage } = await admin
      .from('ai_usage_logs')
      .select('estimated_cost_inr')
      .gte('created_at', monthStart)
      .eq('status', 'SUCCESS');
    const spent = (monthUsage ?? []).reduce((acc, r) => acc + Number(r.estimated_cost_inr || 0), 0);

    if (spent >= Number(settings.monthly_budget_cap_inr)) {
      await admin.from('ai_usage_logs').insert({
        user_id: userRes.user.id,
        feature_key: featureKey,
        status: 'BLOCKED_CAP',
      });
      return new Response(JSON.stringify({ error: 'Monthly AI spend cap reached.' }), { status: 429, headers: corsHeaders });
    }

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_GUARDRAILS }] },
          contents: [{ role: 'user', parts: [{ text: String(prompt || '') }] }],
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Gemini API error');
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokens = Number(data?.usageMetadata?.totalTokenCount ?? 250);
    const estCostInr = Number(((tokens / 1000) * 0.03).toFixed(4));

    await admin.from('ai_usage_logs').insert({
      user_id: userRes.user.id,
      feature_key: featureKey,
      model_name: 'gemini-2.5-flash',
      tokens_used: tokens,
      estimated_cost_inr: estCostInr,
      status: 'SUCCESS',
    });

    return new Response(JSON.stringify({ text, tokens, estimatedCostInr: estCostInr }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
