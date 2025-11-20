// src/routes/dashboard/+page.server.js
import { redirect } from '@sveltejs/kit';
import { getUpcomingAppointments } from '$lib/ghl.js';
import { getSessionById, supabase, getEnrollmentsByStudent } from '$lib/supabase.js';

export async function load({ cookies }) {
  const sessionId = cookies.get('session_id');
  if (!sessionId) throw redirect(302, '/');

  const session = await getSessionById(sessionId);
  if (!session) {
    cookies.delete('session_id', { path: '/' });
    throw redirect(302, '/');
  }

  // Extract number from "Level 4" → "4"
  const levelNum = session.level_key?.match(/\d+/)?.[0] ?? null;

  // Build URLs inline
  const calendarLink = levelNum
    ? `https://calendar.expatspanishlessons.com/live-classes/level-${levelNum}`
    : null;

  const flashcardsShare = levelNum
    ? `https://calendar.expatspanishlessons.com/activate-brainscape-cards/level-${levelNum}`
    : null;

  const user = {
    name: session.first_name,
    level: session.level_key,
    level_number: levelNum,
    ghl_id: session.ghl_contact_id,
    id: session.student_id,
    flashcards_deck: session.flashcards_deck,
    calendarLink,
    flashcardsShare
  };

  const tz = cookies.get('tz') || null;
  const appointments = await getUpcomingAppointments(session.ghl_contact_id, tz);

  // Fetch available classes (upcoming classes that match student's level)
  // Get start of current week and end of 4 weeks (28 days)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday of current week

  const end = new Date(startOfWeek);
  end.setDate(startOfWeek.getDate() + 28); // 4 weeks from start of current week

  const now = startOfWeek.toISOString();
  const endIso = end.toISOString();

  const { data: classesData, error: classesError } = await supabase
    .from('classes')
    .select(`
      id,
      title,
      description,
      notes,
      starts_at,
      duration_minutes,
      capacity,
      levels,
      zoom_link,
      teacher:team(id, full_name, email)
    `)
    .gte('starts_at', now)
    .lte('starts_at', endIso)
    .order('starts_at', { ascending: true });

  if (classesError) {
    console.error('Failed to load classes:', classesError);
  }

  // Filter classes by student's level
  const studentLevelNum = levelNum ? `Level ${levelNum}` : null;
  const availableClasses = (classesData || [])
    .filter(c => {
      if (!c.levels || c.levels.length === 0) return true; // No level restriction
      if (!studentLevelNum) return true; // Student has no level
      return c.levels.includes(studentLevelNum);
    })
    .map(c => ({
      id: c.id,
      title: c.title || 'Class',
      description: c.description,
      notes: c.notes,
      start: c.starts_at,
      duration_minutes: c.duration_minutes || 60,
      capacity: c.capacity || 0,
      levels: Array.isArray(c.levels) ? c.levels : [],
      zoom_link: c.zoom_link,
      teacher: c.teacher ? c.teacher.full_name || c.teacher.email : null,
      teacher_id: c.teacher ? c.teacher.id : null
    }));

  // Fetch student's enrollments
  const enrollments = await getEnrollmentsByStudent(session.student_id);

  // Map enrollments to simpler format with enrollment_id included
  const myClasses = enrollments.map(e => ({
    enrollment_id: e.id,
    class_id: e.class_id,
    status: e.status,
    enrolled_at: e.enrolled_at,
    class: e.classes ? {
      id: e.classes.id,
      title: e.classes.title || 'Class',
      description: e.classes.description,
      notes: e.classes.notes,
      start: e.classes.starts_at,
      duration_minutes: e.classes.duration_minutes || 60,
      capacity: e.classes.capacity || 0,
      levels: Array.isArray(e.classes.levels) ? e.classes.levels : [],
      zoom_link: e.classes.zoom_link,
      teacher: e.classes.teacher ? e.classes.teacher.full_name || e.classes.teacher.email : null
    } : null
  })).filter(e => e.class !== null);

  // Get set of enrolled class IDs
  const enrolledClassIds = new Set(myClasses.map(e => e.class_id));

  return {
    user,
    appointments,
    tz,
    availableClasses,
    myClasses,
    enrolledClassIds: Array.from(enrolledClassIds)
  };
}
