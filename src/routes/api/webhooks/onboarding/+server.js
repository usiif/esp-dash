// src/routes/api/webhook/+server.js
import { json } from '@sveltejs/kit';
import { sendMagicLink } from '$lib/email.js';
import { storeMagicLink, createStudent } from '$lib/supabase.js';
import { generateToken } from '$lib/utils.js';
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
  const firstName = payload.first_name  || null;
  const lastName = payload.last_name || null;
  const fullName =
    payload.full_name ||
    ((firstName || '') + ' ' + (lastName || '')).trim() ||
    'Student';

  const levelKey =
    payload['Dashboard Level'] ||
    null;

  const portalMagic =
    payload?.customData?.portal_magic || payload.portal_magic || null;

  const ghlContactId =
    payload.contact_id || null;

  const tz = payload.timezone || payload.tz || null;

  if (!email) {
    return json({ error: 'Missing email' }, { status: 400 });
  }

  try {
    const token = generateToken();

    await storeMagicLink(email, token, portalMagic, levelKey);

    await createStudent({
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      level_key: levelKey,
      portal_magic: portalMagic,
      ghl_contact_id: ghlContactId,
      tz,
    });

    await sendMagicLink(email, token, fullName);

    return json({ success: true });
  } catch {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
