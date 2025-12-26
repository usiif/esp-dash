// src/routes/+layout.server.js
import { getSessionById, supabase } from '$lib/supabase.js';

export async function load({ cookies, url }) {
  const sessionId = cookies.get('session_id');

  // Public pages that don't need user data
  const publicPages = ['/', '/verify'];
  const isPublicPage = publicPages.includes(url.pathname) || url.pathname.startsWith('/recordings');

  if (!sessionId || isPublicPage) {
    return {
      user: null
    };
  }

  const session = await getSessionById(sessionId);

  if (!session) {
    return {
      user: null
    };
  }

  // Get student email
  const { data: studentData } = await supabase
    .from('students')
    .select('email')
    .eq('id', session.student_id)
    .single();

  return {
    user: {
      name: session.first_name,
      email: studentData?.email || '',
      id: session.student_id,
      level_key: session.level_key || null
    }
  };
}
