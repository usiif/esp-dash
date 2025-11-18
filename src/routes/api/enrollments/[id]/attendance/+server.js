// src/routes/api/enrollments/[id]/attendance/+server.js
import { json } from '@sveltejs/kit';
import { supabase, getSessionById } from '$lib/supabase.js';

export async function PATCH({ params, request, cookies }) {
  // Auth check
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  const enrollmentId = params.id;

  try {
    const body = await request.json();
    const { attendance_status } = body;

    // Validate attendance_status
    const validStatuses = ['attended', 'no-show', 'excused', null];
    if (attendance_status !== null && !validStatuses.includes(attendance_status)) {
      return json({ error: 'Invalid attendance status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update({ attendance_status })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update attendance status:', error);
      return json({ error: 'Failed to update attendance status' }, { status: 500 });
    }

    return json({ success: true, enrollment: data });
  } catch (err) {
    console.error('Error updating attendance status:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
