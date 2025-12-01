// src/routes/api/classes/create/+server.js
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
      title,
      description,
      topic,
      starts_at, // ISO string
      duration_minutes,
      teacher_id,
      levels,
      capacity,
      zoom_link,
      recording_link,
      notes,
      class_type_id
    } = body;

    // Validate required fields
    if (!starts_at) {
      return json({ error: 'Start date is required' }, { status: 400 });
    }

    // Build insert object with defaults
    const newClass = {
      title: title || 'New Class',
      description: description || null,
      topic: topic || null,
      starts_at,
      duration_minutes: duration_minutes || 60,
      teacher_id: teacher_id || null,
      levels: levels || [],
      capacity: capacity || 10,
      zoom_link: zoom_link || null,
      recording_link: recording_link || null,
      notes: notes || null,
      class_type_id: class_type_id || null,
    };

    // Insert the class into Supabase
    const { data, error } = await supabase
      .from('classes')
      .insert(newClass)
      .select(`
        id,
        title,
        description,
        topic,
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
      console.error('Failed to create class:', error);
      return json({ error: 'Failed to create class', details: error.message }, { status: 500 });
    }

    // Sync with Google Calendar (fire and forget)
    if (data?.id) {
      supabase.functions.invoke('class-event-sync', {
        body: { class_id: data.id, action: 'sync' }
      }).catch(err => {
        console.error('Failed to sync class with Google Calendar:', err);
      });
    }

    // Transform the response to match the frontend format
    const startIso = data.starts_at ? new Date(data.starts_at).toISOString() : null;
    const endIso = data.starts_at 
      ? new Date(new Date(data.starts_at).getTime() + (data.duration_minutes || 60) * 60000).toISOString()
      : null;

    const newEvent = {
      id: data.id,
      title: data.title || 'Class',
      description: data.description || null,
      topic: data.topic || null,
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

    return json({ success: true, event: newEvent });

  } catch (err) {
    console.error('Error creating class:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}