// src/routes/logout/+server.js
import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/supabase.js';

export async function GET({ cookies }) {
  // Read the current session cookie
  const sessionId = cookies.get('session_id');

  if (sessionId) {
    try {
      await deleteSession(sessionId);
      console.log('🔴 Session deleted from DB:', sessionId);
    } catch (err) {
      console.error('⚠️ Failed to delete session from DB:', err);
    }

    cookies.delete('session_id', { path: '/' });
  }

  // Delete legacy user cookie if still lingering
  if (cookies.get('user')) {
    cookies.delete('user', { path: '/' });
  }

  console.log('👋 User logged out');
  throw redirect(302, '/');
}
