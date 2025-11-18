// src/routes/+page.server.js
import { redirect } from '@sveltejs/kit';
import { getSessionById } from '$lib/supabase.js';

export async function load({ cookies }) {
  // Read the session cookie
  const sessionId = cookies.get('session_id');

  if (!sessionId) {
    // No session → render the login page normally
    return {};
  }

  // Check if the session exists in Supabase
  const session = await getSessionById(sessionId);

  if (session) {
    console.log('🟢 Existing session found:', {
      session_id: session.id,
      student_id: session.student_id
    });

    // Redirect authenticated user to the dashboard
    throw redirect(302, '/dashboard');
  }

  // If sessionId is invalid (expired / deleted), clear it
  cookies.delete('session_id', { path: '/' });

  return {};
}
