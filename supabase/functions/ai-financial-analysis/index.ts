import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { financialData, userProfile } = await req.json();
    if (!financialData) {
      return new Response(JSON.stringify({ error: "financialData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileContext = userProfile
      ? `\n\nPerfil do usuário (use para personalizar os insights):\n${userProfile}`
      : '';

    const systemPrompt = `Você é um consultor financeiro pessoal brasileiro especializado em análise de finanças domésticas.
Analise os dados financeiros do usuário e gere insights práticos e personalizados.
Responda SEMPRE em português do Brasil.
Seja direto, motivador e prático nas dicas.
Considere o contexto brasileiro (salário mínimo, custo de vida, etc).
Se o usuário forneceu um perfil pessoal, use-o para contextualizar suas análises — por exemplo, se ele diz que tem filhos, não alerte sobre gastos com educação; se mora longe do trabalho, considere transporte como essencial.${profileContext}`;

    const userPrompt = `Analise estes dados financeiros e gere insights:

${JSON.stringify(financialData, null, 2)}

Gere entre 3 e 6 insights relevantes baseados nos dados.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_insights",
              description: "Return structured financial insights",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["positive", "warning", "alert"],
                          description: "positive=elogio, warning=dica/atenção, alert=risco",
                        },
                        title: { type: "string", description: "Título curto do insight" },
                        description: { type: "string", description: "Explicação detalhada com dica prática" },
                      },
                      required: ["type", "title", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_insights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-financial-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
