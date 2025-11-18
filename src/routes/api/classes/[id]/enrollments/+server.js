// src/routes/api/classes/[id]/enrollments/+server.js
import { json } from '@sveltejs/kit';
import { supabase, getSessionById } from '$lib/supabase.js';

export async function GET({ params, cookies }) {
  // Auth check
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  const classId = params.id;

  try {
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        status,
        attendance_status,
        enrolled_at,
        student:students(id, first_name, last_name, email)
      `)
      .eq('class_id', classId)
      .in('status', ['reserved', 'confirmed'])
      .order('enrolled_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch enrollments:', error);
      return json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    return json({ enrollments: enrollments || [] });
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
