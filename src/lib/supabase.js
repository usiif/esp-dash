// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import { env } from '$env/dynamic/private';
import { getFlashcardLinks } from '$lib/flashcards.js';

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

export async function storeCode(email, code) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("auth_codes")
    .upsert({ email, code, expires_at: expiresAt });

  if (error) return false;
  return true;
}

export async function verifyCode(email, input) {
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("auth_codes")
    .select("code, expires_at")
    .eq("email", email)
    .single();

  if (!data) return false;
  if (new Date(data.expires_at) < new Date(now)) return false;
  if (data.code !== input) return false;

  await supabase.from("auth_codes").delete().eq("email", email);

  return true;
}

export async function storeMagicLink(
  email,
  token,
  portalMagic = null,
  level = null
) {
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("magic_links")
    .insert([
      {
        email,
        token,
        portal_magic: portalMagic,
        level,
        expires_at: expiresAt,
        used: false
      },
    ]);

  if (error) throw error;
  return data;
}

export async function verifyMagicLink(token) {
  const { data } = await supabase
    .from("magic_links")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .single();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  await supabase
    .from("magic_links")
    .update({ used: true })
    .eq("id", data.id);

  return { email: data.email };
}

export async function createStudent(student = {}) {
  const {
    email,
    first_name = null,
    last_name = null,
    full_name = null,
    level_key = null,
    portal_magic = null,
    ghl_contact_id = null,
    tz = null,
  } = student;

  if (!email) throw new Error('email is required for createStudent');

  const payload = {
    email,
    first_name,
    last_name,
    full_name,
    level_key,
    portal_magic,
    ghl_contact_id,
    tz,
    onboarding_status: 'pending'
  };

  const { data, error } = await supabase
    .from('students')
    .upsert(payload, { onConflict: 'email' })
    .select()
    .single();

  if (error) throw error;
  return data;
}


export async function getStudentByEmail(email) {
  if (!email) return null;

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data;
}

export async function createSession({
  student_id,
  first_name = null,
  level_key = null,
  ghl_contact_id = null,
  singleSession = false
}) {
  if (!student_id) throw new Error('student_id required');

  const fc = level_key ? getFlashcardLinks(level_key) : { deck: null };

  const payload = {
    student_id,
    first_name,
    level_key,
    ghl_contact_id,
    flashcards_deck: fc.deck || null,
    updated_at: new Date().toISOString()
  };

  if (singleSession) {
    const { data, error } = await supabase
      .from('sessions')
      .upsert(payload, { onConflict: 'student_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // default: insert a new session row (multi-session)
    const { data, error } = await supabase
      .from('sessions')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}


/**
 * Get session by session id
 */
export async function getSessionById(sessionId) {
  if (!sessionId) return null;
  const { data, error } = await supabase
    .from('session_with_student')
    .select('id, student_id, first_name, level_key, ghl_contact_id, flashcards_deck, created_at, updated_at')
    .eq('id', sessionId)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Get the latest session for a student (useful in login flows).
 */
export async function getSessionByStudent(studentId) {
  if (!studentId) return null;
  const { data, error } = await supabase
    .from('session_with_student')
    .select('id, student_id, first_name, level_key, ghl_contact_id, flashcards_deck, created_at, updated_at')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0];
}

export async function deleteSession(sessionId) {
  if (!sessionId) return false;
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  if (error) throw error;
  return true;
}

/**
 * Check if an email is a team member.
 * Returns the team row ({ id, role, full_name, email, last_login }) or null.
 */
export async function getTeamMemberByEmail(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from('team')
    .select('id, role, full_name, email, last_login')
    .ilike('email', email) // case-insensitive match
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Update last_login timestamp for a team member (by email).
 * Returns updated row or null.
 */
export async function touchTeamLastLogin(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from('team')
    .update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
    .ilike('email', email)
    .select('id, role, full_name, email, last_login')
    .limit(1);

  if (error) {
    console.error('[supabase] touchTeamLastLogin error', error);
    return null;
  }

  // data is an array of updated rows — return first or null
  return Array.isArray(data) && data.length ? data[0] : null;
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

/**
 * Create an enrollment for a student in a class
 */
export async function createEnrollment({ student_id, class_id, status = 'reserved' }) {
  if (!student_id || !class_id) {
    throw new Error('student_id and class_id are required');
  }

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      student_id,
      class_id,
      status,
      enrolled_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all enrollments for a student
 */
export async function getEnrollmentsByStudent(studentId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      class_id,
      status,
      enrolled_at,
      attendance_status,
      classes (
        id,
        title,
        description,
        notes,
        starts_at,
        duration_minutes,
        capacity,
        levels,
        zoom_link,
        recording_link,
        teacher:team(id, full_name, email)
      )
    `)
    .eq('student_id', studentId)
    .in('status', ['reserved', 'confirmed'])
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('[supabase] getEnrollmentsByStudent error', error);
    return [];
  }

  return data || [];
}

/**
 * Get enrollment count for a specific class
 */
export async function getEnrollmentCountByClass(classId) {
  const { count, error } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .in('status', ['reserved', 'confirmed']);

  if (error) {
    console.error('[supabase] getEnrollmentCountByClass error', error);
    return 0;
  }

  return count || 0;
}

/**
 * Check if a student is enrolled in a class
 */
export async function isStudentEnrolled(studentId, classId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .in('status', ['reserved', 'confirmed'])
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Cancel an enrollment (update status to cancelled)
 */
export async function cancelEnrollment(enrollmentId) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({ status: 'cancelled' })
    .eq('id', enrollmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
