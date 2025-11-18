// src/routes/api/classes/update/+server.js
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
    const {
      id,
      title,
      description,
      start, // ISO string
      duration_minutes,
      teacher_id,
      levels, // array
      capacity,
      zoom_link,
      recording_link,
      notes,
      class_type_id
    } = body;

    // Validate required fields
    if (!id) {
      return json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Build update object (only include fields that are present)
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (start !== undefined) updates.starts_at = start;
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
    if (teacher_id !== undefined) updates.teacher_id = teacher_id;
    if (levels !== undefined) updates.levels = levels;
    if (capacity !== undefined) updates.capacity = capacity;
    if (zoom_link !== undefined) updates.zoom_link = zoom_link;
    if (recording_link !== undefined) updates.recording_link = recording_link;
    if (notes !== undefined) updates.notes = notes;
    if (class_type_id !== undefined) updates.class_type_id = class_type_id;

    // Update the class in Supabase
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select(`
        id,
        title,
        description,
        starts_at,
        duration_minutes,
        capacity,
        levels,
        zoom_link,
        recording_link,
        notes,
        teacher:team(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Failed to update class:', error);
      return json({ error: 'Failed to update class', details: error.message }, { status: 500 });
    }

    // Transform the response to match the frontend format
    const startIso = data.starts_at ? new Date(data.starts_at).toISOString() : null;
    const endIso = data.starts_at 
      ? new Date(new Date(data.starts_at).getTime() + (data.duration_minutes || 60) * 60000).toISOString()
      : null;

    const updatedEvent = {
      id: data.id,
      title: data.title || 'Class',
      description: data.description || null,
      start: startIso,
      end: endIso,
      duration_minutes: data.duration_minutes || 60,
      capacity: data.capacity || 0,
      levels: Array.isArray(data.levels) ? data.levels : (data.levels ? [data.levels] : []),
      teacher: data.teacher ? data.teacher.full_name || data.teacher.email : null,
      teacher_id: data.teacher ? data.teacher.id : null,
      zoom_link: data.zoom_link || null,
      recording_link: data.recording_link || null,
      notes: data.notes || null,
      color: '#ea580c'
    };

    return json({ success: true, event: updatedEvent });

  } catch (err) {
    console.error('Error updating class:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}