// supabase/functions/notify-overdue-tasks/index.ts
// Called by pg_cron every minute
// 1. Notifies users via Telegram when tasks become overdue
// 2. Sends a 30-min advance reminder before a task is due

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const token = req.headers.get('x-digest-token')
  if (!token || token !== Deno.env.get('DIGEST_TOKEN')) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
    const now     = new Date()
    const nowIso  = now.toISOString()

    // ── 30-min advance window ─────────────────────────────────────────────
    const in30    = new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    const in31    = new Date(now.getTime() + 31 * 60 * 1000).toISOString()

    // ── 1. Overdue tasks ──────────────────────────────────────────────────
    const { data: overdueTasks, error: errOverdue } = await supabase
      .from('tasks')
      .select('id, title, type, priority, due_date, assigned_to')
      .lt('due_date', nowIso)
      .not('status', 'eq', 'closed')
      .eq('overdue_notified', false)

    if (errOverdue) throw errOverdue

    // ── 2. Advance tasks (due in ~30 min, not yet notified) ───────────────
    const { data: advanceTasks, error: errAdv } = await supabase
      .from('tasks')
      .select('id, title, type, priority, due_date, assigned_to')
      .gte('due_date', in30)
      .lt('due_date', in31)
      .not('status', 'eq', 'closed')
      .eq('advance_notified', false)

    if (errAdv) throw errAdv

    const allTasks = [
      ...(overdueTasks  ?? []).map(t => ({ ...t, kind: 'overdue'  as const })),
      ...(advanceTasks  ?? []).map(t => ({ ...t, kind: 'advance'  as const })),
    ]

    if (!allTasks.length) {
      return new Response(JSON.stringify({ ok: true, notified: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Group by user ─────────────────────────────────────────────────────
    const byUser = allTasks.reduce<Record<string, typeof allTasks>>((acc, t) => {
      if (!acc[t.assigned_to]) acc[t.assigned_to] = []
      acc[t.assigned_to].push(t)
      return acc
    }, {})

    const notifiedOverdueIds: string[] = []
    const notifiedAdvanceIds: string[] = []

    await Promise.allSettled(
      Object.entries(byUser).map(async ([userId, userTasks]) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_chat_id, full_name')
          .eq('id', userId)
          .single()

        if (!profile?.telegram_chat_id) return

        const overdueList = userTasks.filter(t => t.kind === 'overdue')
        const advanceList = userTasks.filter(t => t.kind === 'advance')

        // Send overdue message
        if (overdueList.length) {
          const text = [
            `⚠️ *Tarea${overdueList.length > 1 ? 's' : ''} vencida${overdueList.length > 1 ? 's' : ''} (${overdueList.length})*`,
            '',
            ...overdueList.map(t => {
              const d = new Date(t.due_date)
              const hora = d.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Asuncion' })
              return `• ${t.title} — venció a las ${hora}`
            }),
          ].join('\n')

          const res = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: profile.telegram_chat_id, text, parse_mode: 'Markdown' }),
            }
          )
          if (res.ok) notifiedOverdueIds.push(...overdueList.map(t => t.id))
        }

        // Send advance message
        if (advanceList.length) {
          const text = [
            `🔔 *Recordatorio — vence en 30 min*`,
            '',
            ...advanceList.map(t => {
              const d = new Date(t.due_date)
              const hora = d.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Asuncion' })
              return `• ${t.title} — a las ${hora}`
            }),
          ].join('\n')

          const res = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: profile.telegram_chat_id, text, parse_mode: 'Markdown' }),
            }
          )
          if (res.ok) notifiedAdvanceIds.push(...advanceList.map(t => t.id))
        }

        // Web Push — en paralelo con Telegram
        const allUserOverdue = overdueList.length
        const pushBody = allUserOverdue > 0
          ? (allUserOverdue === 1 ? `"${overdueList[0].title}" venció` : `Tenés ${allUserOverdue} tareas vencidas`)
          : (advanceList.length === 1 ? `"${advanceList[0].title}" vence en 30 min` : `Tenés ${advanceList.length} tareas por vencer`)

        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              user_id: userId,
              title:   overdueList.length ? '⚠️ Tarea vencida' : '🔔 Recordatorio',
              body:    pushBody,
              url:     '/tareas',
            }),
          }
        ).catch(() => { /* push falla silenciosamente */ })
      })
    )

    // ── Mark as notified ──────────────────────────────────────────────────
    if (notifiedOverdueIds.length) {
      await supabase.from('tasks').update({ overdue_notified: true }).in('id', notifiedOverdueIds)
    }
    if (notifiedAdvanceIds.length) {
      await supabase.from('tasks').update({ advance_notified: true }).in('id', notifiedAdvanceIds)
    }

    return new Response(
      JSON.stringify({ ok: true, overdue: notifiedOverdueIds.length, advance: notifiedAdvanceIds.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('notify-overdue-tasks error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
