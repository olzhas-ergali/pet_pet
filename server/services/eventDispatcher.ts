import { createAdminClient } from '../lib/supabaseClients.js';

const FORWARD = process.env.WEBHOOK_FORWARD_URL ?? '';

export async function dispatchPendingIntegrationEvents(limit = 20): Promise<number> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    console.warn('[events] admin client unavailable, skip dispatch');
    return 0;
  }

  const { data: rows, error } = await admin
    .from('integration_events')
    .select('id, type, payload, created_at')
    .is('processed_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[events] fetch', error.message);
    return 0;
  }
  if (!rows?.length) return 0;

  let done = 0;
  for (const row of rows) {
    let externalStatus = 'skipped';
    try {
      if (FORWARD) {
        const res = await fetch(FORWARD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: row }),
        });
        externalStatus = res.ok ? `forwarded:${res.status}` : `error:${res.status}`;
      } else {
        externalStatus = 'no_forward_url';
      }
    } catch (e) {
      externalStatus = `forward_exception:${(e as Error).message}`;
    }

    await admin
      .from('integration_events')
      .update({ processed_at: new Date().toISOString(), external_status: externalStatus })
      .eq('id', row.id);
    done += 1;
  }
  return done;
}
