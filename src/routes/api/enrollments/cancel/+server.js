// src/routes/api/enrollments/cancel/+server.js
import { json } from '@sveltejs/kit';
import { getSessionById, cancelEnrollment, supabase } from '$lib/supabase.js';

export async function POST({ request, cookies }) {
  // Auth check
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { enrollment_id } = body;

    // Validate required fields
    if (!enrollment_id) {
      return json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    const studentId = session.student_id;

    // Verify the enrollment belongs to this student
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('id, student_id')
      .eq('id', enrollment_id)
      .single();

    if (fetchError || !enrollment) {
      return json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.student_id !== studentId) {
      return json({ error: 'Unauthorized to cancel this enrollment' }, { status: 403 });
    }

    // Cancel the enrollment
    const cancelledEnrollment = await cancelEnrollment(enrollment_id);

    console.log('✅ Enrollment cancelled:', { studentId, enrollment_id });

    return json({ success: true, enrollment: cancelledEnrollment });

  } catch (err) {
    console.error('❌ Error cancelling enrollment:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
