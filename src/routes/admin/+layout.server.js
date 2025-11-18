// src/routes/admin/+layout.server.js
import { redirect } from '@sveltejs/kit';
import { getSessionById, supabase, getStudentById } from '$lib/supabase.js';
import { getTeamMemberByEmail, touchTeamLastLogin } from '$lib/supabase.js';

export async function load({ cookies }) {
  const sessionId = cookies.get('session_id');
  if (!sessionId) throw redirect(302, '/');

  const session = await getSessionById(sessionId);
  if (!session) {
    cookies.delete('session_id', { path: '/' });
    throw redirect(302, '/');
  }

  // Load the student row (you already have getStudentByEmail earlier; here we might want by id)
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, email, first_name, last_name, full_name, profile_pic')
    .eq('id', session.student_id)
    .single();

  if (studentErr || !student) {
    cookies.delete('session_id', { path: '/' });
    throw redirect(302, '/');
  }

  // Check the team table for this student's email
  const teamMember = await getTeamMemberByEmail(student.email);

  if (!teamMember) {
    // not on the team → deny access
    throw redirect(302, '/');
  }

  // update last_login (best-effort; don't block if it fails)
  try {
    await touchTeamLastLogin(student.email);
  } catch (e) {
    // swallow errors — don't break access if update fails
    console.warn('[admin] failed to update last_login', e);
  }

  // return student (as `user`) and the team role if you want
  return {
    user: student,
    team: {
      id: teamMember.id,
      role: teamMember.role,
      full_name: teamMember.full_name,
      email: teamMember.email,
      last_login: teamMember.last_login
    }
  };
}
