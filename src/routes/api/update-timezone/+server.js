// src/routes/api/update-timezone/+server.js
import { json } from '@sveltejs/kit';
import { getSessionById, supabase } from '$lib/supabase.js';

export async function POST({ request, cookies }) {
  try {
    // Auth check
    const sessionId = cookies.get('session_id');
    if (!sessionId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    const { tz } = await request.json();

    if (!tz) {
      return json({ error: 'Missing timezone' }, { status: 400 });
    }

    // Update timezone in database
    const { error } = await supabase
      .from('students')
      .update({ tz, updated_at: new Date().toISOString() })
      .eq('id', session.student_id);

    if (error) {
      console.error('[update-timezone] Failed to update timezone:', error);
      return json({ error: 'Failed to update timezone' }, { status: 500 });
    }

    console.log('[update-timezone] Timezone updated for student:', session.student_id, tz);

    return json({ success: true });
  } catch (err) {
    console.error('[update-timezone] Error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
