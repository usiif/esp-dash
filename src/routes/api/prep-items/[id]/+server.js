// src/routes/api/prep-items/[id]/+server.js
import { json } from '@sveltejs/kit';
import { supabase, getSessionById } from '$lib/supabase.js';

// PATCH - Update a prep item
export async function PATCH({ params, request, cookies }) {
  // Auth check
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  const prepItemId = params.id;

  try {
    const body = await request.json();
    const updates = {};

    // Only include fields that are present in the request
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.url !== undefined) updates.url = body.url;
    if (body.kind !== undefined) updates.kind = body.kind;
    if (body.is_required !== undefined) updates.is_required = body.is_required;

    const { data, error } = await supabase
      .from('class_prep_items')
      .update(updates)
      .eq('id', prepItemId)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to update prep item:', error);
      return json({ error: 'Failed to update prep item' }, { status: 500 });
    }

    return json({ success: true, prep_item: data });
  } catch (err) {
    console.error('Error updating prep item:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a prep item
export async function DELETE({ params, cookies }) {
  // Auth check
  const sessionId = cookies.get('session_id');
  if (!sessionId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  const prepItemId = params.id;

  try {
    const { error } = await supabase
      .from('class_prep_items')
      .delete()
      .eq('id', prepItemId);

    if (error) {
      console.error('Failed to delete prep item:', error);
      return json({ error: 'Failed to delete prep item' }, { status: 500 });
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting prep item:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
