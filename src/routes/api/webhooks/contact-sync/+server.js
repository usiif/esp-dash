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

  // If there's nothing to identify the student with, return success (no-op)
  if (!email && !ghlContactId) {
    return json({ success: true });
  }

  try {
    // Check if student exists by GHL contact ID or email
    let existingStudent = null;

    if (ghlContactId) {
      const { data } = await supabase
        .from('students')
        .select('id, onboarding_status')
        .eq('ghl_contact_id', ghlContactId)
        .maybeSingle();
      existingStudent = data;
    } else if (email) {
      const { data } = await supabase
        .from('students')
        .select('id, onboarding_status')
        .eq('email', email)
        .maybeSingle();
      existingStudent = data;
    }

    if (!existingStudent) {
      // Student doesn't exist - do nothing
      console.log('[contact-sync] Student not found, skipping');
      return json({ success: true, skipped: true });
    }

    // Student exists - update without touching onboarding_status
    console.log('[contact-sync] Updating existing student:', existingStudent.id);

    const updatePayload = {
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      level_key: levelKey,
      portal_magic: portalMagic,
      ghl_contact_id: ghlContactId,
      updated_at: new Date().toISOString()
      // Explicitly NOT including onboarding_status or tz
    };

    const { error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', existingStudent.id);

    if (error) throw error;

    console.log('[contact-sync] Student updated successfully');

    return json({ success: true });
  } catch (err) {
    console.error('[webhooks/sync-contacts] error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
