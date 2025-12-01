// src/routes/api/enrollments/cancel/+server.js
import { json } from '@sveltejs/kit';
import { getSessionById, cancelEnrollment, supabase } from '$lib/supabase.js';
import { sendClassCancellationEmail } from '$lib/email.js';

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

    // Verify the enrollment belongs to this student and fetch class details
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        classes (
          id,
          title,
          topic,
          starts_at,
          duration_minutes,
          teacher:team(full_name)
        )
      `)
      .eq('id', enrollment_id)
      .single();

    if (fetchError || !enrollment) {
      return json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.student_id !== studentId) {
      return json({ error: 'Unauthorized to cancel this enrollment' }, { status: 403 });
    }

    // Get student email
    const { data: studentData } = await supabase
      .from('students')
      .select('email')
      .eq('id', studentId)
      .single();

    // Cancel the enrollment
    const cancelledEnrollment = await cancelEnrollment(enrollment_id);

    console.log('✅ Enrollment cancelled:', { studentId, enrollment_id });

    // Sync cancellation with Google Calendar (fire and forget)
    if (enrollment?.classes?.id) {
      supabase.functions.invoke('class-event-sync', {
        body: { class_id: enrollment.classes.id, action: 'sync' }
      }).catch(err => {
        console.error('Failed to sync cancellation with Google Calendar:', err);
      });
    }

    // Send cancellation email (fire and forget)
    if (studentData?.email && enrollment.classes) {
      const tz = session.tz || 'UTC';

      sendClassCancellationEmail({
        studentEmail: studentData.email,
        studentName: session.first_name || 'there',
        className: enrollment.classes.title || 'Spanish Class',
        teacherName: enrollment.classes.teacher?.full_name || 'your teacher',
        startsAt: enrollment.classes.starts_at,
        durationMinutes: enrollment.classes.duration_minutes || 60,
        topic: enrollment.classes.topic,
        timezone: tz
      }).catch(err => {
        console.error('Failed to send cancellation email:', err);
        // Don't fail the cancellation if email fails
      });
    }

    return json({ success: true, enrollment: cancelledEnrollment });

  } catch (err) {
    console.error('❌ Error cancelling enrollment:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
