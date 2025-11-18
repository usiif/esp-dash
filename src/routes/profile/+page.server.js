// src/routes/profile/+page.server.js
import { redirect } from '@sveltejs/kit';
import { getSessionById, supabase } from '$lib/supabase.js'; // supabase export is used to read student row

export async function load({ cookies }) {
  const sessionId = cookies.get('session_id');
  if (!sessionId) throw redirect(302, '/');

  const session = await getSessionById(sessionId);
  if (!session) {
    cookies.delete('session_id', { path: '/' });
    throw redirect(302, '/');
  }

  // fetch student row from students table
  const { data: student, error } = await supabase
    .from('students')
    .select('id, email, first_name, last_name, full_name, profile_pic, level_key, tz, ghl_contact_id, onboarding_status, created_at, updated_at')
    .eq('id', session.student_id)
    .single();

  if (error || !student) {
    // if student missing, clear session and redirect to login
    cookies.delete('session_id', { path: '/' });
    throw redirect(302, '/');
  }

  // build user object used by the page and header components
  const user = {
    id: student.id,
    email: student.email,
    first_name: student.first_name,
    last_name: student.last_name,
    full_name: student.full_name,
    profile_pic: student.profile_pic || null,
    level_key: student.level_key,
    level_number: student.level_key?.match(/\d+/)?.[0] ?? null,
    tz: student.tz || null,
    ghl_id: student.ghl_contact_id || null,
    onboarding_status: student.onboarding_status,
    created_at: student.created_at,
    updated_at: student.updated_at
  };

  return { user };
}
