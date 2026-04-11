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

    const prompt = `Sos un experto en atraer inversión extranjera a ${pais}, especializado en el sector inmobiliario/real estate.

Tu objetivo es generar búsquedas que encuentren noticias e información que POSITION a ${pais} como destino atractivo para inversores extranjeros en real estate.

El usuario quiere analizar: "${idea}"

Generá entre 3 y 5 queries de búsqueda optimizadas para Google.

ENFOQUE de las queries:
- Macroeconomía: crecimiento del PBI, estabilidad económica, riesgo país
- Infraestructura: proyectos en curso, mejoras de conectividad, obras públicas
- Marco legal: beneficios fiscales, facilidad de inversión, seguridad jurídica
- Mercado inmobiliario: tendencias de precios, nuevos desarrollos, zonas de oportunidad
- Comparativas regionales: cómo se compara ${pais} con otros países de LatAm para invertir

Las queries deben estar en INGLÉS cuando el tema apunte a inversores extranjeros, y en español cuando sea contenido local relevante.

REGLAS:
- Devolver SOLO un array JSON de strings
- NO incluir explicaciones
- NO usar markdown
- Máximo 5 queries
- Mínimo 3 queries
- Cada query debe ayudar a encontrar noticias que VENDAN ${pais} como destino de inversión

Ejemplo de formato de respuesta:
["Paraguay economic growth 2026", "Asunción real estate investment opportunities", "Paraguay foreign investor tax benefits", "Paraguay infrastructure projects 2026"]

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
