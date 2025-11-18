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

  return {
    totalStudents: totalStudents ?? 0,
    activeSessions: sessionsCount ?? 0,
    pendingOnboarding: pendingOnboarding ?? 0
  };
}
