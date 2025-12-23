import { supabase } from '$lib/supabase.js';

export async function load() {
  // Fetch all placement sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('placement_sessions')
    .select('*')
    .order('started_at', { ascending: false });

  if (sessionsError) {
    console.error('Error fetching placement sessions:', sessionsError);
    return { sessions: [] };
  }

  return {
    sessions: sessions || []
  };
}
