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
    const { consultant_id, queries, pais = 'Paraguay', fecha_override } = await req.json()

    if (!consultant_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'consultant_id requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Fecha: usar override para testing o today para producción ─
    const fecha = fecha_override || new Date().toISOString().split('T')[0]

    // ── Supabase con service role (escribe sin RLS) ──────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 1. Tavily — buscar noticias ──────────────────────────
    const tavilyRes = await fetch('https://api.tavily.com/search', {
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

Analizá las siguientes noticias REALES y generá un informe claro, concreto y accionable.

REGLAS OBLIGATORIAS:
- NO usar frases genéricas como "está experimentando cambios", "es importante considerar", "diversificación", "oportunidades en diferentes sectores"
- Incluir datos concretos si existen (zonas, precios, tendencias)
- Máximo 3 oraciones en el resumen
- La señal para el inversor debe ser específica y accionable
- NO inventar información que no esté en las noticias
- Incluir SOLO titulares con URL real que empiece con http

Respondé ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "summary": "Resumen concreto y específico (máx 3 oraciones)",
  "titulares": [
    { "titulo": "...", "url": "https://...", "fuente": "..." }
  ],
  "senal_inversor": "Acción clara y específica para inversor"
}

Noticias: ${JSON.stringify(noticias)}`

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

    // ── 2B. Validar links ─────────────────────────────────────
    const validTitulares = (parsed.titulares ?? []).filter(
      (t: { titulo: string; url: string; fuente: string }) =>
        t.url && t.url.startsWith('http')
    )

    // ── 2C. Detectar calidad ──────────────────────────────────
    const WEAK_PATTERNS = [
      /está experimentando/i,
      /es importante considerar/i,
      /diversificación/i,
      /en diferentes sectores/i,
      /oportunidades en diferentes/i,
      /el mercado inmobiliario en general/i,
    ]

    const quality = WEAK_PATTERNS.some(r => r.test(parsed.summary))
      ? 'low'
      : 'ok'

    // ── 3. Guardar en DB (upsert por tenant + fecha) ─────────
    const { error: dbError } = await supabase
      .from('market_digests')
      .upsert(
        {
          consultant_id,
          fecha,
          summary: parsed.summary,
          titulares: validTitulares,
          senal_inversor: parsed.senal_inversor,
          queries,
          status: 'draft',
          quality,
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
