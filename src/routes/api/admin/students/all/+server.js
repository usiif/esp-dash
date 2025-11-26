// src/routes/api/admin/students/all/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, email, level_key')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('[api/admin/students/all] error:', error);
      return json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    return json({ students: data || [] });
  } catch (err) {
    console.error('[api/admin/students/all] unexpected error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
