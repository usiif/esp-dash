import { json } from '@sveltejs/kit';
import { supabase, getSessionById } from '$lib/supabase.js';

export async function POST({ cookies }) {
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  // Update ghl_portal_signup to true
  const { error } = await supabase
    .from('students')
    .update({ ghl_portal_signup: true })
    .eq('id', session.student_id);

  if (error) {
    console.error('Failed to update portal signup status:', error);
    return json({ error: 'Failed to update' }, { status: 500 });
  }

  return json({ success: true });
}
