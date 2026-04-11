import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { idea, pais = 'Paraguay' } = await req.json()

    if (!idea || idea.trim().length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Idea requerida (mínimo 3 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `Sos un experto en búsquedas de mercado inmobiliario en ${pais}.

El usuario quiere analizar: "${idea}"

Generá entre 3 y 5 queries de búsqueda optimizadas para Google.
Las queries deben ser específicas, claras y enfocadas en mercado inmobiliario.

REGLAS:
- Devolver SOLO un array JSON de strings
- NO incluir explicaciones
- NO usar markdown
- Máximo 5 queries
- Mínimo 3 queries
- Cada query debe ser útil para encontrar noticias relevantes

Ejemplo de formato de respuesta:
["mercado inmobiliario Luque 2026", "precios departamentos Asunción tendencias", "inversión inmobiliaria Paraguay CIT"]

Respondé SOLO con el array JSON.`

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
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    )

    if (!groqRes.ok) {
      throw new Error(`Groq error: ${groqRes.status}`)
    }

    const groqData = await groqRes.json()
    const content = groqData.choices[0].message.content

    // Extraer array de queries del resultado
    let queries: string[] = []
    
    try {
      // Intentar parsear directamente
      queries = JSON.parse(content)
    } catch {
      // Si no es JSON puro, buscar array en el texto
      const match = content.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          queries = JSON.parse(match[0])
        } catch {
          // Fallback: dividir por líneas y limpiar
          queries = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('[') && !line.startsWith(']'))
            .map(line => line.replace(/^["']|["'],?$/g, ''))
            .filter(line => line.length > 0)
        }
      }
    }

    // Validar que sea array y tenga contenido
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('No se pudieron generar queries válidas')
    }

    // Limpiar y validar
    queries = queries
      .filter(q => typeof q === 'string' && q.trim().length > 0)
      .slice(0, 5)

    return new Response(
      JSON.stringify({ success: true, queries }),
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
