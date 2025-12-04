// src/routes/recordings/+page.server.js
import { supabase } from '$lib/supabase.js';

export async function load() {
  try {
    // Fetch all recordings with associated class details
    const { data: recordings, error } = await supabase
      .from('class_recordings')
      .select(`
        id,
        class_id,
        zoom_start_time,
        zoom_duration_minutes,
        video_storage_path,
        transcript_text,
        notes_json,
        created_at,
        classes (
          id,
          title,
          topic,
          teacher:team(full_name)
        )
      `)
      .order('zoom_start_time', { ascending: false });

    if (error) {
      console.error('Error fetching recordings:', error);
      return { recordings: [] };
    }

    // Parse notes_json and get video URLs for each recording
    const processedRecordings = (recordings || []).map(rec => {
      let notes = null;
      if (rec.notes_json) {
        try {
          notes = typeof rec.notes_json === 'string'
            ? JSON.parse(rec.notes_json)
            : rec.notes_json;
        } catch (err) {
          console.error('Error parsing notes_json:', err);
        }
      }

      // Get video URL from storage - create signed URL with 1 hour expiry
      let videoUrl = null;
      if (rec.video_storage_path) {
        const { data: urlData } = supabase.storage
          .from('class-recordings')
          .createSignedUrl(rec.video_storage_path, 3600);
        videoUrl = urlData?.signedUrl;
      }

      return {
        ...rec,
        notes,
        videoUrl
      };
    });

    return {
      recordings: processedRecordings
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { recordings: [] };
  }
}
