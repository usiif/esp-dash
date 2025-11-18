// src/routes/api/classes/delete/+server.js
import { json } from '@sveltejs/kit';
import { supabase, getSessionById } from '$lib/supabase.js';

export async function POST({ request, cookies }) {
  // Auth check
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    // Validate required fields
    if (!id) {
      return json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Delete the class from Supabase
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete class:', error);
      return json({ error: 'Failed to delete class', details: error.message }, { status: 500 });
    }

    console.log('✅ Class deleted successfully:', id);
    return json({ success: true, id });

  } catch (err) {
    console.error('❌ Error deleting class:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
