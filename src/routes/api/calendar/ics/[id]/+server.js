// src/routes/api/calendar/ics/[id]/+server.js
import { supabase } from '$lib/supabase.js';

export async function GET({ params }) {
  const { id: classId } = params;

  try {
    // Fetch class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        title,
        topic,
        starts_at,
        duration_minutes,
        zoom_link,
        teacher:team(full_name)
      `)
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return new Response('Class not found', { status: 404 });
    }

    const startDate = new Date(classData.starts_at);
    const endDate = new Date(startDate.getTime() + (classData.duration_minutes || 60) * 60000);

    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const now = formatDate(new Date());

    // Escape special characters in ICS format
    const escapeICS = (str) => {
      if (!str) return '';
      return str.replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\n/g, '\\n');
    };

    const description = `Topic: ${classData.topic || 'Spanish Class'}\\nTeacher: ${classData.teacher?.full_name || 'your teacher'}\\n\\nJoin via Zoom: ${classData.zoom_link || ''}\\n\\nView your dashboard: https://my.expatspanishlessons.com/dashboard`;

    const iCalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Expat Spanish Lessons//Class Booking//EN
BEGIN:VEVENT
UID:class-${classData.id}-${now}@expatspanishlessons.com
DTSTAMP:${now}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${escapeICS(classData.title) || 'Spanish Class'}
DESCRIPTION:${description}
LOCATION:Zoom (Online)
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return new Response(iCalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="class-${classData.id}.ics"`
      }
    });
  } catch (err) {
    console.error('Error generating iCal file:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
