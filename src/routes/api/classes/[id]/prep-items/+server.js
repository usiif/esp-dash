// src/routes/api/classes/[id]/prep-items/+server.js
import { json } from '@sveltejs/kit';
import { supabase, getSessionById } from '$lib/supabase.js';

// GET - Fetch all prep items for a class
export async function GET({ params, cookies }) {
  // Auth check
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  const classId = params.id;

  try {
    const { data, error } = await supabase
      .from('class_prep_items')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch prep items:', error);
      return json({ error: 'Failed to fetch prep items' }, { status: 500 });
    }

    return json({ prep_items: data || [] });
  } catch (err) {
    console.error('Error fetching prep items:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new prep item for a class
export async function POST({ params, request, cookies }) {
  // Auth check
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  const classId = params.id;

  try {
    const body = await request.json();
    const { title, description, url, kind, is_required, position } = body;

    if (!title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }

    const newPrepItem = {
      class_id: classId,
      title,
      description: description || null,
      url: url || null,
      kind: kind || null,
      is_required: is_required || false
    };

    const { data, error } = await supabase
      .from('class_prep_items')
      .insert(newPrepItem)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create prep item:', error);
      return json({ error: 'Failed to create prep item' }, { status: 500 });
    }

    return json({ success: true, prep_item: data });
  } catch (err) {
    console.error('Error creating prep item:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
