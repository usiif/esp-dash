// src/routes/api/classes/[id]/enroll/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { sendClassBookingEmail } from '$lib/email.js';

export async function POST({ params, request }) {
  const { id: classId } = params;

  try {
    const { student_id } = await request.json();

    if (!student_id) {
      return json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get student details for email
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('email, first_name, last_name, tz')
      .eq('id', student_id)
      .single();

    if (studentError || !studentData) {
      return json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if the class exists and get its details for email
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        capacity,
        title,
        topic,
        starts_at,
        duration_minutes,
        zoom_link,
        teacher:team(full_name, email)
      `)
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return json({ error: 'Class not found' }, { status: 404 });
    }

    // Check current enrollment count
    const { count: enrollmentCount, error: countError } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId)
      .in('status', ['confirmed', 'reserved']);

    if (countError) {
      console.error('[api/classes/enroll] count error:', countError);
      return json({ error: 'Failed to check enrollment count' }, { status: 500 });
    }

    // Check if class is full
    if (enrollmentCount >= classData.capacity) {
      return json({ error: 'Class is full' }, { status: 400 });
    }

    // Check if student is already enrolled (active enrollment)
    const { data: activeEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .in('status', ['confirmed', 'reserved'])
      .maybeSingle();

    if (checkError) {
      console.error('[api/classes/enroll] check error:', checkError);
      return json({ error: 'Failed to check existing enrollment' }, { status: 500 });
    }

    if (activeEnrollment) {
      return json({ error: 'Student is already enrolled in this class' }, { status: 400 });
    }

    // Check if there's a cancelled enrollment that we can reactivate
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', student_id)
      .eq('class_id', classId)
      .single();

    // Create or reactivate the enrollment
    let enrollment;
    if (existingEnrollment && existingEnrollment.status === 'cancelled') {
      // Reactivate cancelled enrollment
      const { data: updated, error: updateError } = await supabase
        .from('enrollments')
        .update({
          status: 'confirmed',
          enrolled_at: new Date().toISOString()
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();

      if (updateError) {
        console.error('[api/classes/enroll] reactivate error:', updateError);
        return json({ error: 'Failed to reactivate enrollment' }, { status: 500 });
      }

      enrollment = updated;
      console.log('✅ Admin re-enrolled student (reactivated):', { student_id, classId, enrollmentId: enrollment.id });
    } else {
      // Create new enrollment
      const { data: newEnrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          class_id: classId,
          student_id: student_id,
          status: 'confirmed',
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (enrollError) {
        console.error('[api/classes/enroll] insert error:', enrollError);
        return json({ error: 'Failed to create enrollment' }, { status: 500 });
      }

      enrollment = newEnrollment;
      console.log('✅ Admin enrolled student:', { student_id, classId, enrollmentId: enrollment.id });
    }

    // Sync enrollment with Google Calendar (fire and forget)
    if (classId) {
      supabase.functions.invoke('class-event-sync', {
        body: { class_id: classId, action: 'sync' }
      }).catch(err => {
        console.error('Failed to sync enrollment with Google Calendar:', err);
      });
    }

    // Send confirmation email (don't await - fire and forget)
    if (studentData?.email) {
      const tz = studentData.tz || 'UTC';

      sendClassBookingEmail({
        studentEmail: studentData.email,
        studentName: studentData.first_name || 'there',
        className: classData.title || 'Spanish Class',
        teacherName: classData.teacher?.full_name || 'your teacher',
        startsAt: classData.starts_at,
        durationMinutes: classData.duration_minutes || 60,
        topic: classData.topic,
        zoomLink: classData.zoom_link,
        timezone: tz,
        classId: classId
      }).catch(err => {
        console.error('Failed to send booking confirmation email:', err);
        // Don't fail the booking if email fails
      });
    } else {
      console.warn('⚠️ Could not send confirmation email: student email not found');
    }

    return json({ enrollment });
  } catch (err) {
    console.error('[api/classes/enroll] unexpected error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
