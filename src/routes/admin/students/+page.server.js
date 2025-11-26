// src/routes/admin/students/+page.server.js
import { supabase } from '$lib/supabase.js';

export async function load({ url }) {
  // pagination params
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const per_page = Math.max(1, Math.min(500, parseInt(url.searchParams.get('per_page') || '50', 10))); // cap at 500
  const searchQuery = url.searchParams.get('search') || '';

  // compute range
  const start = (page - 1) * per_page;
  const end = start + per_page - 1;

  try {
    // Build query with search filter
    let countQuery = supabase.from('students').select('id', { head: true, count: 'exact' });
    let dataQuery = supabase
      .from('students')
      .select('id, full_name, first_name, last_name, email, level_key, onboarding_status, tz, profile_pic, ghl_contact_id');

    // Apply search filter if provided
    if (searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      countQuery = countQuery.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);
      dataQuery = dataQuery.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);
    }

    // 1) total count (exact)
    const { count: total, error: countErr } = await countQuery;

    if (countErr) {
      console.error('[admin/students] count error', countErr);
    }

    // 2) fetch page rows using range for consistent pagination
    const { data, error } = await dataQuery
      .order('full_name', { ascending: true })
      .range(start, end);

    if (error) {
      console.error('[admin/students] supabase error:', error);
      return { students: [], page, per_page, total: total ?? 0, search: searchQuery };
    }

    const students = (data || []).map((s) => ({
      id: s.id,
      full_name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—',
      email: s.email || '—',
      level_key: s.level_key || '—',
      onboarding_status: s.onboarding_status || 'pending',
      tz: s.tz || '—',
      profile_pic: s.profile_pic || null,
      ghl_contact_id: s.ghl_contact_id || null
    }));

    return { students, page, per_page, total: total ?? 0, search: searchQuery };
  } catch (err) {
    console.error('[admin/students] unexpected error:', err);
    return { students: [], page, per_page, total: 0, search: searchQuery };
  }
}
