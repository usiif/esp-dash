import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

export async function load({ params }) {
  const sessionId = params.id;

  // Fetch session data
  const { data: session, error: sessionError } = await supabase
    .from('placement_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw error(404, 'Placement session not found');
  }

  // Fetch all level attempts for this session
  const { data: levelAttempts, error: attemptsError } = await supabase
    .from('placement_level_attempts')
    .select('*')
    .eq('session_id', sessionId)
    .order('level', { ascending: true });

  if (attemptsError) {
    throw error(500, 'Failed to fetch level attempts');
  }

  // Fetch answers for each level attempt
  const levelAttemptsWithAnswers = await Promise.all(
    (levelAttempts || []).map(async (attempt) => {
      const { data: answers, error: answersError } = await supabase
        .from('placement_answers')
        .select('*')
        .eq('level_attempt_id', attempt.id)
        .order('created_at', { ascending: true });

      if (answersError) {
        console.error('Error fetching answers:', answersError);
        return { ...attempt, answers: [] };
      }

      return {
        ...attempt,
        answers: answers || []
      };
    })
  );

  return {
    session,
    levelAttempts: levelAttemptsWithAnswers
  };
}
