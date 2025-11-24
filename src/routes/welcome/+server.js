// src/routes/welcome/+server.js
import { redirect } from '@sveltejs/kit';
import { verifyMagicLink, getStudentByEmail, createSession, supabase } from '$lib/supabase.js';
import { getCalendarLink } from '$lib/calendars.js';
import { getFlashcardLinks } from '$lib/flashcards.js';

export async function GET({ url, cookies }) {
  const token = url.searchParams.get('token');
  const tz = url.searchParams.get('tz');

  console.log('[welcome] Incoming request');

  if (!token) {
    console.warn('[welcome] Missing token');
    throw redirect(302, '/');
  }

  console.log('[welcome] Token received:', token.slice(0, 6) + '...');

  // 1) Verify & consume magic token
  const verified = await verifyMagicLink(token);
  if (!verified || !verified.email) {
    console.warn('[welcome] Token invalid or not associated with an email');
    throw redirect(302, '/');
  }

  console.log('[welcome] Token verified for:', verified.email);

  // 2) Fetch student from Supabase
  const student = await getStudentByEmail(verified.email);
  if (!student) {
    console.warn('[welcome] Student not found in Supabase:', verified.email);
    throw redirect(302, '/');
  }

  console.log('[welcome] Student loaded:', {
    id: student.id,
    email: student.email,
    name: student.full_name
  });

  // 2.5) Update timezone if provided
  if (tz) {
    await supabase
      .from('students')
      .update({ tz, updated_at: new Date().toISOString() })
      .eq('id', student.id);
  }

  // 3) Optional resources — for logs / sanity checks only
  const level = student.level_key || null;
  const calendarLink = level ? getCalendarLink(level) : null;
  const flashcards = level ? getFlashcardLinks(level) : null;

  console.log('[welcome] Level & resources resolved:', {
    level,
    hasCalendar: !!calendarLink,
    hasFlashcards: !!flashcards,
    flashcards_deck: flashcards?.deck || null
  });

  // 4) Create (upsert) a session in DB (single-session behavior)
  const session = await createSession({
    student_id: student.id,
    first_name: student.first_name || student.full_name,
    level_key: student.level_key,
    ghl_contact_id: student.ghl_contact_id
  });

  if (!session || !session.id) {
    console.error('[welcome] Failed to create session for student:', student.id);
    throw redirect(302, '/');
  }

  // 5) Set httpOnly session cookie (store only the session id)
  cookies.set('session_id', session.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 14 // 14 days
  });

  console.log('[welcome] Session created and cookie set:', {
    student_id: student.id,
    session_id: session.id
  });

  // 6) Redirect to dashboard
  console.log('[welcome] Redirect → /dashboard');
  throw redirect(302, '/dashboard');
}
