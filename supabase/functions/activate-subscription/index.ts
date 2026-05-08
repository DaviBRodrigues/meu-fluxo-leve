import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { months: number; price: number; name: string }> = {
  basic: { months: 1, price: 59.9, name: 'Plano Básico' },
  essential: { months: 3, price: 39.9, name: 'Plano Essencial' },
  premium: { months: 6, price: 29.9, name: 'Plano Premium' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as 'start_trial' | 'simulate_payment';
    const planId = body.plan_id as string | undefined;

    const admin = createClient(supabaseUrl, serviceRole);
    const userId = userData.user.id;

    if (action === 'start_trial') {
      const { data: existing } = await admin
        .from('profiles')
        .select('subscription_status, trial_started_at')
        .eq('user_id', userId)
        .single();

      if (existing?.trial_started_at) {
        return new Response(JSON.stringify({ ok: true, message: 'Trial já iniciado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const now = new Date();
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      await admin
        .from('profiles')
        .update({
          subscription_status: 'trial',
          trial_started_at: now.toISOString(),
          trial_expires_at: expires.toISOString(),
        })
        .eq('user_id', userId);

      return new Response(JSON.stringify({ ok: true, expires_at: expires.toISOString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'simulate_payment') {
      if (!planId || !PLANS[planId]) {
        return new Response(JSON.stringify({ error: 'Plano inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const plan = PLANS[planId];
      const now = new Date();
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + plan.months);

      await admin
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_started_at: now.toISOString(),
          subscription_expires_at: expires.toISOString(),
          hotmart_transaction_id: `SIM-${Date.now()}`,
        })
        .eq('user_id', userId);

      await admin.from('subscription_events').insert({
        user_id: userId,
        email: userData.user.email,
        event_type: 'simulated_payment',
        hotmart_transaction_id: `SIM-${Date.now()}`,
        raw_payload: { plan_id: planId, plan_name: plan.name, price: plan.price },
        processed: true,
      });

      return new Response(
        JSON.stringify({ ok: true, plan: plan.name, expires_at: expires.toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
