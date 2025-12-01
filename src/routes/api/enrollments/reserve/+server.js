// src/routes/api/enrollments/reserve/+server.js
import { json } from '@sveltejs/kit';
import {
  supabase,
  getSessionById,
  createEnrollment,
  getEnrollmentCountByClass,
  isStudentEnrolled
} from '$lib/supabase.js';
import { sendClassBookingEmail } from '$lib/email.js';

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
    const { class_id } = body;

    // Validate required fields
    if (!class_id) {
      return json({ error: 'Class ID is required' }, { status: 400 });
    }

    const studentId = session.student_id;

    // Check if already enrolled (active enrollment)
    const alreadyEnrolled = await isStudentEnrolled(studentId, class_id);
    if (alreadyEnrolled) {
      return json({ error: 'Already enrolled in this class' }, { status: 400 });
    }

    // Check if there's a cancelled enrollment that we can reactivate
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('class_id', class_id)
      .single();

    // Get student email for confirmation email
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('email')
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) {
      console.error('Failed to get student email:', studentError);
      // Continue with enrollment even if we can't get student email
    }

    // Get class details to check capacity and for email
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        capacity,
        title,
        topic,
        starts_at,
        duration_minutes,
        zoom_link,
        teacher:team(full_name, email)
      `)
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return json({ error: 'Class not found' }, { status: 404 });
    }

    // Check current enrollment count
    const currentCount = await getEnrollmentCountByClass(class_id);

    if (currentCount >= classData.capacity) {
      return json({ error: 'Class is full' }, { status: 400 });
    }

    // Create or reactivate the enrollment
    let enrollment;
    if (existingEnrollment && existingEnrollment.status === 'cancelled') {
      // Reactivate cancelled enrollment
      const { data: updated, error: updateError } = await supabase
        .from('enrollments')
        .update({
          status: 'reserved',
          enrolled_at: new Date().toISOString()
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();

      if (updateError) throw updateError;
      enrollment = updated;
      console.log('✅ Student re-enrolled (reactivated):', { studentId, class_id, enrollmentId: enrollment.id });
    } else {
      // Create new enrollment
      enrollment = await createEnrollment({
        student_id: studentId,
        class_id,
        status: 'reserved'
      });
      console.log('✅ Student enrolled:', { studentId, class_id, enrollmentId: enrollment.id });
    }

    // Sync enrollment with Google Calendar (fire and forget)
    if (class_id) {
      supabase.functions.invoke('class-event-sync', {
        body: { class_id, action: 'sync' }
      }).catch(err => {
        console.error('Failed to sync enrollment with Google Calendar:', err);
      });
    }

    // Send confirmation email (don't await - fire and forget)
    if (studentData?.email) {
      const tz = session.tz || 'UTC';

      sendClassBookingEmail({
        studentEmail: studentData.email,
        studentName: session.first_name || 'there',
        className: classData.title || 'Spanish Class',
        teacherName: classData.teacher?.full_name || 'your teacher',
        startsAt: classData.starts_at,
        durationMinutes: classData.duration_minutes || 60,
        topic: classData.topic,
        zoomLink: classData.zoom_link,
        timezone: tz,
        classId: class_id
      }).catch(err => {
        console.error('Failed to send booking confirmation email:', err);
        // Don't fail the booking if email fails
      });
    } else {
      console.warn('⚠️ Could not send confirmation email: student email not found');
    }

    return json({ success: true, enrollment });

  } catch (err) {
    console.error('❌ Error creating enrollment:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
