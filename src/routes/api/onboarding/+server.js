// src/routes/api/onboarding/+server.js
import { json } from '@sveltejs/kit';
import { getSessionById, supabase } from '$lib/supabase.js';

export async function POST({ request, cookies }) {
  try {
    const { onboarding } = await request.json(); // expected: 'password_set' | 'complete' etc.
    if (!onboarding) return json({ error: 'Missing onboarding state' }, { status: 400 });

    // read session_id cookie (session-based flow)
    const sessionId = cookies.get('session_id');
    if (!sessionId) return json({ error: 'No session (not authenticated)' }, { status: 401 });

    // get session row to discover student_id
    const session = await getSessionById(sessionId);
    if (!session || !session.student_id) {
      // clear cookie on broken session
      cookies.delete('session_id', { path: '/' });
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    const studentId = session.student_id;

    // update students table
    const { data, error } = await supabase
      .from('students')
      .update({ onboarding_status: onboarding, updated_at: new Date().toISOString() })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      console.error('[onboarding] failed to update student:', error);
      return json({ error: 'Failed to update onboarding' }, { status: 500 });
    }

    return json({ success: true, onboarding, student: data });
  } catch (err) {
    console.error('[onboarding] error:', err);
    return json({ error: 'Server error' }, { status: 500 });
  }
}
