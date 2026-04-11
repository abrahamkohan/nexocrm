import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { consultant_id, queries, pais = 'Paraguay' } =
      await req.json()

    if (!consultant_id) {
      throw new Error('consultant_id requerido')
    }

    // ── Supabase con service role (escribe sin RLS) ──────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 1. Tavily — buscar noticias ──────────────────────────
    const tavilyRes = await fetch('https://api.tavily.com/search',{
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: Deno.env.get('TAVILY_API_KEY'),
        query: queries.join(' OR '),
        search_depth: 'basic',
        max_results: 8,
        include_answer: true,
      }),
    })

    if (!tavilyRes.ok) {
      throw new Error(`Tavily error: ${tavilyRes.status}`)
    }

    const tavilyData = await tavilyRes.json()
    const noticias = tavilyData.results?.slice(0, 8) ?? []

    // ── 2. Groq — analizar y devolver JSON ───────────────────
    const prompt = `Sos un analista inmobiliario experto en ${pais}.
Analizá estas noticias y respondé ÚNICAMENTE con JSON válido,
sin texto adicional, con esta estructura exacta:
{
  "summary": "Resumen ejecutivo en 2-3 oraciones concretas",
  "titulares": [
    {
      "titulo": "Titular de la noticia",
      "url": "https://...",
      "fuente": "Nombre del medio"
    }
  ],
  "senal_inversor": "Un consejo práctico concreto para inversores"
}
Noticias disponibles: ${JSON.stringify(noticias)}`

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      }
    )

    if (!groqRes.ok) {
      throw new Error(`Groq error: ${groqRes.status}`)
    }

    const groqData = await groqRes.json()
    const parsed = JSON.parse(groqData.choices[0].message.content)

    // ── 3. Guardar en DB (upsert por tenant + fecha) ─────────
    const today = new Date().toISOString().split('T')[0]

    const { error: dbError } = await supabase
      .from('market_digests')
      .upsert(
        {
          consultant_id,
          fecha: today,
          summary: parsed.summary,
          titulares: parsed.titulares ?? [],
          senal_inversor: parsed.senal_inversor,
          queries,
          status: 'published',
        },
        { onConflict: 'consultant_id,fecha' }
      )

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
