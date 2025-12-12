// src/routes/dashboard/+page.server.js
import { redirect } from '@sveltejs/kit';
import { getSessionById, supabase, getEnrollmentsByStudent } from '$lib/supabase.js';

export async function load({ cookies }) {
  const sessionId = cookies.get('session_id');
  if (!sessionId) throw redirect(302, '/');

  const session = await getSessionById(sessionId);
  if (!session) {
    cookies.delete('session_id', { path: '/' });
    throw redirect(302, '/');
  }

  // Extract number from "Level 4" → "4"
  const levelNum = session.level_key?.match(/\d+/)?.[0] ?? null;

  // Get student email
  const { data: studentData } = await supabase
    .from('students')
    .select('email')
    .eq('id', session.student_id)
    .single();

  // Brainscape deck URLs by level
  const brainscapeDeckUrls = {
    '1': 'https://www.brainscape.com/l/dashboard/level-1-new-spanish-from-zero-23382761/decks',
    '2': 'https://www.brainscape.com/l/dashboard/level-2-new-spanish-from-zero-23382829/decks',
    '3': 'https://www.brainscape.com/l/dashboard/level-3-new-beyond-the-basics-23382371/decks',
    '4': 'https://www.brainscape.com/l/dashboard/nivel-4-new-conversation-basics-23382456/decks',
    '5': 'https://www.brainscape.com/l/dashboard/nivel-5-new-conversation-foundations-23417363/decks',
    '6': 'https://www.brainscape.com/l/dashboard/nivel-6-new-conversation-momentum-23417569/decks'
  };

  // Build URLs inline
  const calendarLink = levelNum
    ? `https://calendar.expatspanishlessons.com/live-classes/level-${levelNum}`
    : null;

  const flashcardsActivate = levelNum
    ? `https://calendar.expatspanishlessons.com/activate-brainscape-cards/level-${levelNum}`
    : null;

  const flashcardsDeck = levelNum && brainscapeDeckUrls[levelNum]
    ? brainscapeDeckUrls[levelNum]
    : null;

  const user = {
    name: session.first_name,
    email: studentData?.email || '',
    level: session.level_key,
    level_number: levelNum,
    ghl_id: session.ghl_contact_id,
    id: session.student_id,
    flashcards_deck: session.flashcards_deck,
    calendarLink,
    flashcardsActivate,
    flashcardsDeck,
    needs_timezone: !session.tz // Flag if timezone is missing
  };

  // Fetch available classes (upcoming classes that match student's level)
  const now = new Date().toISOString();
  const end = new Date();
  end.setDate(end.getDate() + 14); // Next 2 weeks
  const endIso = end.toISOString();

  const { data: classesData, error: classesError } = await supabase
    .from('classes')
    .select(`
      id,
      title,
      description,
      notes,
      starts_at,
      duration_minutes,
      capacity,
      levels,
      zoom_link,
      teacher:team(id, full_name, email),
      class_prep_items(
        id,
        title,
        description,
        url,
        kind,
        position,
        is_required
      )
    `)
    .gte('starts_at', now)
    .lte('starts_at', endIso)
    .order('starts_at', { ascending: true });

  if (classesError) {
    console.error('Failed to load classes:', classesError);
  }

  // Filter classes by student's level
  const studentLevelNum = levelNum ? `Level ${levelNum}` : null;
  const availableClasses = (classesData || [])
    .filter(c => {
      if (!c.levels || c.levels.length === 0) return true; // No level restriction
      if (!studentLevelNum) return true; // Student has no level
      return c.levels.includes(studentLevelNum);
    })
    .map(c => ({
      id: c.id,
      title: c.title || 'Class',
      description: c.description,
      notes: c.notes,
      start: c.starts_at,
      duration_minutes: c.duration_minutes || 60,
      capacity: c.capacity || 0,
      levels: Array.isArray(c.levels) ? c.levels : [],
      zoom_link: c.zoom_link,
      teacher: c.teacher ? c.teacher.full_name || c.teacher.email : null,
      teacher_id: c.teacher ? c.teacher.id : null
    }));

  // Fetch student's enrollments
  const enrollments = await getEnrollmentsByStudent(session.student_id);

  // Map enrollments to simpler format with enrollment_id and prep_items included
  const myClasses = enrollments.map(e => ({
    enrollment_id: e.id,
    class_id: e.class_id,
    status: e.status,
    enrolled_at: e.enrolled_at,
    class: e.classes ? {
      id: e.classes.id,
      title: e.classes.title || 'Class',
      description: e.classes.description,
      notes: e.classes.notes,
      start: e.classes.starts_at,
      duration_minutes: e.classes.duration_minutes || 60,
      capacity: e.classes.capacity || 0,
      levels: Array.isArray(e.classes.levels) ? e.classes.levels : [],
      zoom_link: e.classes.zoom_link,
      teacher: e.classes.teacher ? e.classes.teacher.full_name || e.classes.teacher.email : null,
      prep_items: []  // Will be populated from classes data if available
    } : null
  })).filter(e => e.class !== null);

  // Get set of enrolled class IDs
  const enrolledClassIds = new Set(myClasses.map(e => e.class_id));

  // Fetch prep items for enrolled classes
  const enrolledClassIdsList = Array.from(enrolledClassIds);
  if (enrolledClassIdsList.length > 0) {
    const { data: prepItemsData } = await supabase
      .from('class_prep_items')
      .select('*')
      .in('class_id', enrolledClassIdsList)
      .order('created_at', { ascending: true });

    // Map prep items to classes
    const prepItemsByClass = (prepItemsData || []).reduce((acc, item) => {
      if (!acc[item.class_id]) acc[item.class_id] = [];
      acc[item.class_id].push({
        id: item.id,
        title: item.title,
        description: item.description,
        url: item.url,
        kind: item.kind,
        is_required: item.is_required
      });
      return acc;
    }, {});

    // Add prep items to myClasses
    myClasses.forEach(enrollment => {
      if (enrollment.class && prepItemsByClass[enrollment.class.id]) {
        enrollment.class.prep_items = prepItemsByClass[enrollment.class.id];
      }
    });
  }

  // Fetch prep completion status for all enrollments
  const enrollmentIds = myClasses.map(e => e.enrollment_id);
  let prepStatus = {};

  if (enrollmentIds.length > 0) {
    const { data: prepStatusData } = await supabase
      .from('enrollment_prep_status')
      .select('enrollment_id, prep_item_id, is_done')
      .in('enrollment_id', enrollmentIds);

    // Create a map: enrollment_id -> Array of completed prep_item_ids
    prepStatus = (prepStatusData || []).reduce((acc, item) => {
      if (!acc[item.enrollment_id]) {
        acc[item.enrollment_id] = [];
      }
      if (item.is_done) {
        acc[item.enrollment_id].push(item.prep_item_id);
      }
      return acc;
    }, {});
  }

  return {
    user,
    availableClasses,
    myClasses,
    enrolledClassIds: Array.from(enrolledClassIds),
    prepStatus
  };
}
