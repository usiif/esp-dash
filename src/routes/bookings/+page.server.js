// src/routes/bookings/+page.server.js
import { redirect } from '@sveltejs/kit';
import { getSessionById, getEnrollmentsByStudent } from '$lib/supabase.js';

export async function load({ cookies }) {
  const sessionId = cookies.get('session_id');
  if (!sessionId) throw redirect(302, '/');

  const session = await getSessionById(sessionId);
  if (!session) {
    cookies.delete('session_id', { path: '/' });
    throw redirect(302, '/');
  }

  const user = {
    name: session.first_name,
    level: session.level_key,
    id: session.student_id
  };

  // Fetch ALL enrollments (past and upcoming)
  const allEnrollments = await getEnrollmentsByStudent(session.student_id);

  const now = new Date();

  // Separate into upcoming and past
  const upcomingBookings = allEnrollments
    .filter(e => e.classes && new Date(e.classes.starts_at) >= now)
    .map(e => ({
      enrollment_id: e.id,
      class_id: e.class_id,
      status: e.status,
      attendance_status: e.attendance_status,
      enrolled_at: e.enrolled_at,
      class: {
        id: e.classes.id,
        title: e.classes.title || 'Class',
        description: e.classes.description,
        notes: e.classes.notes,
        start: e.classes.starts_at,
        duration_minutes: e.classes.duration_minutes || 60,
        capacity: e.classes.capacity || 0,
        levels: Array.isArray(e.classes.levels) ? e.classes.levels : [],
        zoom_link: e.classes.zoom_link,
        recording_link: e.classes.recording_link,
        teacher: e.classes.teacher ? e.classes.teacher.full_name || e.classes.teacher.email : null
      }
    }))
    .sort((a, b) => new Date(a.class.start) - new Date(b.class.start));

  const pastBookings = allEnrollments
    .filter(e => e.classes && new Date(e.classes.starts_at) < now)
    .map(e => ({
      enrollment_id: e.id,
      class_id: e.class_id,
      status: e.status,
      attendance_status: e.attendance_status,
      enrolled_at: e.enrolled_at,
      class: {
        id: e.classes.id,
        title: e.classes.title || 'Class',
        description: e.classes.description,
        notes: e.classes.notes,
        start: e.classes.starts_at,
        duration_minutes: e.classes.duration_minutes || 60,
        capacity: e.classes.capacity || 0,
        levels: Array.isArray(e.classes.levels) ? e.classes.levels : [],
        zoom_link: e.classes.zoom_link,
        recording_link: e.classes.recording_link,
        teacher: e.classes.teacher ? e.classes.teacher.full_name || e.classes.teacher.email : null
      }
    }))
    .sort((a, b) => new Date(b.class.start) - new Date(a.class.start)); // Most recent first

  return { user, upcomingBookings, pastBookings };
}
