// src/routes/api/enrollments/reserve/+server.js
import { json } from '@sveltejs/kit';
import {
  supabase,
  getSessionById,
  createEnrollment,
  getEnrollmentCountByClass,
  isStudentEnrolled
} from '$lib/supabase.js';

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

    // Check if already enrolled
    const alreadyEnrolled = await isStudentEnrolled(studentId, class_id);
    if (alreadyEnrolled) {
      return json({ error: 'Already enrolled in this class' }, { status: 400 });
    }

    // Get class details to check capacity
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('capacity')
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

    // Create the enrollment
    const enrollment = await createEnrollment({
      student_id: studentId,
      class_id,
      status: 'reserved'
    });

    console.log('✅ Student enrolled:', { studentId, class_id, enrollmentId: enrollment.id });

    return json({ success: true, enrollment });

  } catch (err) {
    console.error('❌ Error creating enrollment:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
