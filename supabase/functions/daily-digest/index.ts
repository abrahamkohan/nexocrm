// supabase/functions/daily-digest/index.ts
// Called by GitHub Actions every morning at 7am Paraguay time
// Sends each user their tasks due today + overdue tasks

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PRIORITY_LABEL: Record<string, string> = {
  high: '🔴 Alta',
  medium: '🟡 Media',
  low: '🟢 Baja',
}

const TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamada',
  meeting: 'Reunión',
  email: 'Email',
  visit: 'Visita',
}

function paraguayDate(offsetDays = 0): string {
  const d = new Date()
  // Paraguay: UTC-4
  d.setUTCHours(d.getUTCHours() - 4)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

serve(async (req) => {
  // Protección: solo GitHub Actions puede llamar esto
  const token = req.headers.get('x-digest-token')
  if (!token || token !== Deno.env.get('DIGEST_TOKEN')) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const today     = paraguayDate(0)
    const tomorrow  = paraguayDate(1)

    // Tareas de hoy + vencidas (no cerradas)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, type, priority, due_date, notes, assigned_to, lead_id')
      .lte('due_date', tomorrow)
      .not('status', 'eq', 'closed')
      .order('due_date', { ascending: true })

    if (tasksError) throw tasksError
    if (!tasks?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no tasks' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Agrupar por assigned_to
    const byUser = tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
      if (!acc[task.assigned_to]) acc[task.assigned_to] = []
      acc[task.assigned_to].push(task)
      return acc
    }, {})

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
    const FROM = Deno.env.get('RESEND_FROM') ?? 'Kohan & Campos <onboarding@resend.dev>'

    const sendResults = await Promise.allSettled(
      Object.entries(byUser).map(async ([userId, userTasks]) => {
        // Obtener email del usuario
        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        const email = userData?.user?.email
        if (!email) return

        const overdue  = userTasks.filter(t => t.due_date < today)
        const dueToday = userTasks.filter(t => t.due_date === today)
        const dueTomorrow = userTasks.filter(t => t.due_date === tomorrow)

        const taskRows = (tasks: typeof userTasks, label: string, bg: string) =>
          tasks.length === 0 ? '' : `
            <h3 style="font-size: 13px; font-weight: 700; color: #fff; background: ${bg};
              padding: 6px 12px; border-radius: 6px; margin: 20px 0 8px;">${label} (${tasks.length})</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              ${tasks.map(t => `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 4px; color: #1a1f2b;">${t.title}</td>
                  <td style="padding: 8px 4px; color: #6b7280; white-space: nowrap;">${TYPE_LABEL[t.type] ?? t.type}</td>
                  <td style="padding: 8px 4px; white-space: nowrap;">${PRIORITY_LABEL[t.priority] ?? t.priority}</td>
                  <td style="padding: 8px 4px; color: #9ca3af; white-space: nowrap;">${t.due_date}</td>
                </tr>
              `).join('')}
            </table>
          `

        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #14223A; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <p style="color: #fff; font-weight: 700; font-size: 16px; margin: 0;">Kohan &amp; Campos</p>
              <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 4px 0 0;">Resumen diario de tareas — ${today}</p>
            </div>
            <div style="background: #fff; border: 1px solid #e4e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              ${taskRows(overdue,   '⚠️ Vencidas',        '#dc2626')}
              ${taskRows(dueToday,  '📅 Hoy',             '#0369a1')}
              ${taskRows(dueTomorrow, '📆 Mañana',        '#475569')}
              <p style="font-size: 11px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #f0f0f0; padding-top: 12px;">
                Este resumen se envía automáticamente cada mañana.
              </p>
            </div>
          </div>
        `

        const totalCount = overdue.length + dueToday.length + dueTomorrow.length
        const subject = overdue.length > 0
          ? `⚠️ Tenés ${overdue.length} tarea${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''} — ${today}`
          : `📅 ${totalCount} tarea${totalCount > 1 ? 's' : ''} para hoy y mañana`

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from: FROM, to: email, subject, html }),
        })
      })
    )

    const sent = sendResults.filter(r => r.status === 'fulfilled').length

    return new Response(JSON.stringify({ ok: true, sent, users: Object.keys(byUser).length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('daily-digest error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
