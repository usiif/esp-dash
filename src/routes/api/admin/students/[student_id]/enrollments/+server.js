// src/routes/api/admin/students/[student_id]/enrollments/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

export async function GET({ params, cookies }) {
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentId = params.student_id;
  if (!studentId) {
    return json({ error: 'Student ID required' }, { status: 400 });
  }

  try {
    // Fetch all enrollments for the student with class details
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        classes (
          id,
          title,
          starts_at,
          duration_minutes,
          teacher:team(full_name, email)
        )
      `)
      .eq('student_id', studentId)
      .in('status', ['reserved', 'confirmed'])
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('[admin/enrollments] error:', error);
      return json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    // Format the data
    const enrollments = (data || [])
      .filter(e => e.classes) // Only include enrollments with valid class data
      .map(e => ({
        id: e.id,
        status: e.status,
        enrolled_at: e.enrolled_at,
        class_title: e.classes.title || 'Untitled Class',
        starts_at: e.classes.starts_at,
        duration_minutes: e.classes.duration_minutes || 60,
        teacher: e.classes.teacher ? (e.classes.teacher.full_name || e.classes.teacher.email) : null
      }));

    return json({ enrollments });
  } catch (err) {
    console.error('[admin/enrollments] unexpected error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
