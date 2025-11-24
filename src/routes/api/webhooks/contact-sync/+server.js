// src/routes/api/webhooks/sync-contacts/+server.js
import { json } from '@sveltejs/kit';
import { createStudent } from '$lib/supabase.js';
import { env } from '$env/dynamic/private';

const WEBHOOK_SECRET = env.WEBHOOK_SECRET;

export async function POST({ request }) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const secret = payload?.customData?.secret;
  if (secret !== WEBHOOK_SECRET) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const email = payload.email || payload.Email;
  const firstName = payload.first_name || null;
  const lastName = payload.last_name || null;
  const fullName =
    payload.full_name ||
    ((firstName || '') + ' ' + (lastName || '')).trim() ||
    null;

  const levelKey = payload['Dashboard Level'] || null;
  const portalMagic = payload?.customData?.portal_magic || payload.portal_magic || null;
  const ghlContactId = payload.contact_id || null;
  const tz = payload.timezone || payload.tz || null;

  // If there's nothing to identify the student with, return success (no-op)
  if (!email && !ghlContactId) {
    return json({ success: true });
  }

  try {
    // Reuse createStudent (it upserts on email)
    const student = await createStudent({
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      level_key: levelKey,
      portal_magic: portalMagic,
      ghl_contact_id: ghlContactId,
      tz,
    });

    return json({ success: true });
  } catch (err) {
    console.error('[webhooks/sync-contacts] error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
