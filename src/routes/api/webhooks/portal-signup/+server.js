// src/routes/api/webhooks/portal-signup/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { env } from '$env/dynamic/private';

const WEBHOOK_SECRET = env.WEBHOOK_SECRET;

export async function POST({ request }) {
  console.log('🔔 [portal-signup] Webhook received');

  let payload;

  try {
    payload = await request.json();
  } catch (err) {
    console.error('❌ [portal-signup] Invalid JSON:', err);
    return json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate secret
  const secret = payload?.customData?.secret;
  if (secret !== WEBHOOK_SECRET) {
    console.warn('⚠️ [portal-signup] Unauthorized');
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const email = payload.email || payload.Email;
  const ghlContactId = payload.contact_id || null;

  console.log('🔍 [portal-signup] Looking up student:', { email, ghlContactId });

  if (!email && !ghlContactId) {
    console.warn('⚠️ [portal-signup] Missing identifiers');
    return json({ error: 'Missing email or contact_id' }, { status: 400 });
  }

  try {
    // Find student by GHL ID or email
    let studentId = null;

    if (ghlContactId) {
      const { data } = await supabase
        .from('students')
        .select('id')
        .eq('ghl_contact_id', ghlContactId)
        .maybeSingle();

      if (data) {
        studentId = data.id;
        console.log('✅ [portal-signup] Found by GHL ID:', studentId);
      }
    }

    if (!studentId && email) {
      const { data } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        studentId = data.id;
        console.log('✅ [portal-signup] Found by email:', studentId);
      }
    }

    if (!studentId) {
      console.error('❌ [portal-signup] Student not found');
      return json({ error: 'Student not found' }, { status: 404 });
    }

    // Update ONLY the onboarding_status column
    const { error: updateError } = await supabase
      .from('students')
      .update({ onboarding_status: 'complete' })
      .eq('id', studentId);

    if (updateError) {
      console.error('❌ [portal-signup] Update failed:', updateError);
      return json({ error: 'Update failed' }, { status: 500 });
    }

    console.log('✅ [portal-signup] Status updated to complete for student:', studentId);

    return json({ success: true, studentId });

  } catch (err) {
    console.error('❌ [portal-signup] Unexpected error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
