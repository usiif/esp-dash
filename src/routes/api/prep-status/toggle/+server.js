// src/routes/api/prep-status/toggle/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

export async function POST({ request, cookies }) {
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { enrollment_id, prep_item_id, is_done } = await request.json();

    if (!enrollment_id || !prep_item_id) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert the prep status
    const { data, error } = await supabase
      .from('enrollment_prep_status')
      .upsert({
        enrollment_id,
        prep_item_id,
        is_done,
        checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'enrollment_id,prep_item_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[prep-status/toggle] error:', error);
      return json({ error: 'Failed to update prep status' }, { status: 500 });
    }

    return json({ success: true, data });
  } catch (err) {
    console.error('[prep-status/toggle] unexpected error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
