// src/routes/admin/classes/+page.server.js
import { redirect } from '@sveltejs/kit';
import { supabase, getSessionById } from '$lib/supabase.js';

function addMinutesToIso(iso, minutes) {
  if (!iso) return null;
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + (minutes || 0));
  return d.toISOString();
}

export async function load({ cookies }) {
  // auth: ensure session exists (admin layout may also enforce this)
  const sessionId = cookies.get('session_id');
  if (!sessionId) throw redirect(302, '/');

  const session = await getSessionById(sessionId);
  if (!session) {
    cookies.delete('session_id', { path: '/' });
    throw redirect(302, '/');
  }

  // fetch classes starting today through +90 days
  const startIso = new Date().toISOString();
  const end = new Date();
  end.setDate(end.getDate() + 90);
  const endIso = end.toISOString();

  // select teacher via foreign table (team)
  const { data, error } = await supabase
    .from('classes')
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
    .gte('starts_at', startIso)
    .lte('starts_at', endIso)
    .order('starts_at', { ascending: true })
    .limit(1000);

  if (error) {
    console.error('Failed to load classes:', error);
    return { events: [] };
  }

  // Get enrollment counts for all classes
  const classIds = (data || []).map(c => c.id);
  let enrollmentCounts = {};

  if (classIds.length > 0) {
    const { data: countData } = await supabase
      .from('enrollments')
      .select('class_id')
      .in('class_id', classIds)
      .in('status', ['reserved', 'confirmed']);

    enrollmentCounts = (countData || []).reduce((acc, enrollment) => {
      acc[enrollment.class_id] = (acc[enrollment.class_id] || 0) + 1;
      return acc;
    }, {});
  }

  const events = (data || []).map((r) => {
    const enrolled = enrollmentCounts[r.id] || 0;
    const capacity = r.capacity || 0;
    const startIso = r.starts_at ? new Date(r.starts_at).toISOString() : null;
    const endIso = r.starts_at ? addMinutesToIso(r.starts_at, r.duration_minutes || 60) : null;
    return {
      id: r.id,
      title: r.title || 'Class',
      description: r.description || null,
      topic: r.topic || null,
      start: startIso,
      end: endIso,
      duration_minutes: r.duration_minutes || 60,
      capacity,
      enrolled,
      available_spaces: Math.max(0, capacity - enrolled),
      levels: Array.isArray(r.levels) ? r.levels : (r.levels ? [r.levels] : []),
      teacher: r.teacher ? r.teacher.full_name || r.teacher.email : null,
      teacher_id: r.teacher ? r.teacher.id : null,
      zoom_link: r.zoom_link || null,
      recording_link: r.recording_link || null,
      notes: r.notes || null,
      color: '#ea580c' // placeholder; you can derive/store colors if you want
    };
  });

  // Fetch all teachers from team table
  const { data: teachersData, error: teachersError } = await supabase
    .from('team')
    .select('id, full_name, email')
    .order('full_name', { ascending: true });

  if (teachersError) {
    console.error('Failed to load teachers:', teachersError);
  }

  const teachers = teachersData || [];

  // Fetch all class types (templates)
  const { data: classTypesData, error: classTypesError } = await supabase
    .from('class_types')
    .select(`
      id,
      title,
      description,
      default_duration_minutes,
      default_capacity,
      default_levels,
      default_zoom_link,
      teacher:team(id, full_name, email)
    `)
    .order('title', { ascending: true });

  if (classTypesError) {
    console.error('Failed to load class types:', classTypesError);
  }

  const classTypes = (classTypesData || []).map(ct => ({
    id: ct.id,
    title: ct.title,
    description: ct.description,
    default_duration_minutes: ct.default_duration_minutes || 60,
    default_capacity: ct.default_capacity || 12,
    default_levels: Array.isArray(ct.default_levels) ? ct.default_levels : [],
    default_zoom_link: ct.default_zoom_link,
    teacher_id: ct.teacher ? ct.teacher.id : null
  }));

  return { events, teachers, classTypes };
}
