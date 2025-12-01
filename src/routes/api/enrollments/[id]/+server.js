// src/routes/api/enrollments/[id]/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { sendClassCancellationEmail } from '$lib/email.js';

export async function DELETE({ params }) {
  const { id: enrollmentId } = params;

  try {
    // Fetch enrollment with class and student details for email
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        class_id,
        student_id,
        status,
        students (
          email,
          first_name,
          last_name,
          tz
        ),
        classes (
          id,
          title,
          topic,
          starts_at,
          duration_minutes,
          teacher:team(full_name)
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Cancel the enrollment (mark as cancelled, don't delete)
    const { error: cancelError } = await supabase
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('id', enrollmentId);

    if (cancelError) {
      console.error('[api/enrollments/delete] error:', cancelError);
      return json({ error: 'Failed to cancel enrollment' }, { status: 500 });
    }

    // Sync cancellation with Google Calendar (fire and forget)
    if (enrollment?.class_id) {
      supabase.functions.invoke('class-event-sync', {
        body: { class_id: enrollment.class_id, action: 'sync' }
      }).catch(err => {
        console.error('Failed to sync cancellation with Google Calendar:', err);
      });
    }

    // Send cancellation email (fire and forget)
    if (enrollment.students?.email && enrollment.classes) {
      const tz = enrollment.students.tz || 'UTC';

      sendClassCancellationEmail({
        studentEmail: enrollment.students.email,
        studentName: enrollment.students.first_name || 'there',
        className: enrollment.classes.title || 'Spanish Class',
        teacherName: enrollment.classes.teacher?.full_name || 'your teacher',
        startsAt: enrollment.classes.starts_at,
        durationMinutes: enrollment.classes.duration_minutes || 60,
        topic: enrollment.classes.topic,
        timezone: tz
      }).catch(err => {
        console.error('Failed to send cancellation email:', err);
      });
    }

    return json({ success: true, message: 'Enrollment canceled successfully' });
  } catch (err) {
    console.error('[api/enrollments/delete] unexpected error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
