// src/routes/api/webhooks/portal-signup/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
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
  const ghlContactId = payload.contact_id || null;

  // Need at least one identifier
  if (!email && !ghlContactId) {
    return json({ error: 'Missing email or contact_id' }, { status: 400 });
  }

  try {
    // Find the student by email or GHL contact ID
    let query = supabase.from('students').select('id, onboarding_status');

    if (email) {
      query = query.eq('email', email);
    } else if (ghlContactId) {
      query = query.eq('ghl_contact_id', ghlContactId);
    }

    const { data: student, error: findError } = await query.single();

    if (findError || !student) {
      console.error('[portal-signup] Student not found:', { email, ghlContactId, error: findError });
      return json({ error: 'Student not found' }, { status: 404 });
    }

    // Update onboarding status to 'complete'
    const { data, error } = await supabase
      .from('students')
      .update({
        onboarding_status: 'complete',
        updated_at: new Date().toISOString()
      })
      .eq('id', student.id)
      .select()
      .single();

    if (error) {
      console.error('[portal-signup] Failed to update onboarding status:', error);
      return json({ error: 'Failed to update onboarding status' }, { status: 500 });
    }

    console.log('✅ Portal signup: onboarding status updated to complete', {
      studentId: student.id,
      email,
      previousStatus: student.onboarding_status,
      newStatus: 'complete'
    });

    return json({ success: true, student: data });
  } catch (err) {
    console.error('[portal-signup] error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
