// src/routes/api/verify-code/+server.js
import { json } from '@sveltejs/kit';
import { getStudentByEmail, createSession, verifyCode } from '$lib/supabase.js';
import { env } from '$env/dynamic/private';

export async function POST({ request, cookies }) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return json({ error: 'Missing email or code.' }, { status: 400 });
    }

    // Optional OTP check (uncomment if you use auth_codes flow in supabase)
    const valid = await verifyCode(email, code);
    if (!valid) return json({ error: 'Invalid code.' }, { status: 401 });

    // Look up the student in Supabase (not GHL)
    const student = await getStudentByEmail(email);
    if (!student || !student.id) {
      console.warn('[verify-code] student not found for email:', email);
      return json({ error: 'Student not found.' }, { status: 404 });
    }

    console.log('[verify-code] student found:', { id: student.id, email: student.email });

    // Create a session row (multi-session by default)
    const session = await createSession({
      student_id: student.id,
      first_name: student.first_name || student.full_name,
      level_key: student.level_key,
      ghl_contact_id: student.ghl_contact_id
    });

    if (!session || !session.id) {
      console.error('[verify-code] Failed to create session for student:', student.id);
      return json({ error: 'Failed to create session.' }, { status: 500 });
    }

    // Remove legacy client-side user cookie if it exists
    if (cookies.get('user')) {
      cookies.delete('user', { path: '/' });
    }

    // Set httpOnly session cookie (only the session id)
    cookies.set('session_id', session.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 14 // 14 days
    });

    console.log('[verify-code] session created & cookie set:', { student_id: student.id, session_id: session.id });

    return json({ success: true });
  } catch (err) {
    console.error('[verify-code] error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
