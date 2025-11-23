// src/routes/admin/+page.server.js
import { supabase } from '$lib/supabase.js';

export async function load() {
  // total students
  const { count: totalStudents, error: e1 } = await supabase
    .from('students')
    .select('id', { head: true, count: 'exact' });

  if (e1) {
    console.error('[admin] students count error', e1);
  }

  // active sessions (count rows in sessions)
  const { count: sessionsCount, error: e2 } = await supabase
    .from('sessions')
    .select('id', { head: true, count: 'exact' });

  if (e2) {
    console.error('[admin] sessions count error', e2);
  }

  // pending onboarding
  const { count: pendingOnboarding, error: e3 } = await supabase
    .from('students')
    .select('id', { head: true, count: 'exact' })
    .eq('onboarding_status', 'pending');

  if (e3) {
    console.error('[admin] pending count error', e3);
  }

  // students by level breakdown
  const { data: studentsData, error: e4 } = await supabase
    .from('students')
    .select('level_key');

  if (e4) {
    console.error('[admin] students by level error', e4);
  }

  // Count students by level
  const studentsByLevel = (studentsData || []).reduce((acc, student) => {
    const level = student.level_key || 'No Level';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  // Get start and end of current week (Sunday to Saturday)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7); // Next Sunday
  endOfWeek.setHours(0, 0, 0, 0);

  // Get bookings for the week
  const { data: weeklyClasses, error: e5 } = await supabase
    .from('classes')
    .select('id')
    .gte('starts_at', startOfWeek.toISOString())
    .lt('starts_at', endOfWeek.toISOString());

  if (e5) {
    console.error('[admin] weekly classes error', e5);
  }

  const classIds = (weeklyClasses || []).map(c => c.id);
  let weeklyBookings = 0;

  if (classIds.length > 0) {
    const { count, error: e6 } = await supabase
      .from('enrollments')
      .select('id', { head: true, count: 'exact' })
      .in('class_id', classIds)
      .in('status', ['reserved', 'confirmed']);

    if (e6) {
      console.error('[admin] weekly bookings error', e6);
    }

    weeklyBookings = count ?? 0;
  }

  return {
    totalStudents: totalStudents ?? 0,
    activeSessions: sessionsCount ?? 0,
    pendingOnboarding: pendingOnboarding ?? 0,
    studentsByLevel,
    weeklyBookings
  };
}
