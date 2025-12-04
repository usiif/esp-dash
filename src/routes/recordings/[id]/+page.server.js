// src/routes/recordings/[id]/+page.server.js
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

export async function load({ params }) {
  const { id } = params;

  try {
    // Fetch single recording with class details
    const { data: recording, error: fetchError } = await supabase
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
      .eq('id', id)
      .single();

    if (fetchError) {
      throw error(404, `Recording not found: ${fetchError.message}`);
    }

    if (!recording) {
      throw error(404, 'Recording not found');
    }

    // Parse notes_json
    let notes = null;
    if (recording.notes_json) {
      try {
        notes = typeof recording.notes_json === 'string'
          ? JSON.parse(recording.notes_json)
          : recording.notes_json;
      } catch (err) {
        console.error('Error parsing notes_json:', err);
      }
    }

    // Get video URL from storage - create signed URL with 1 hour expiry
    let videoUrl = null;
    if (recording.video_storage_path) {
      try {
        const { data: urlData, error: urlError } = await supabase.storage
          .from('class-recordings')
          .createSignedUrl(recording.video_storage_path, 3600);

        if (urlError) {
          console.error('Error creating signed URL:', urlError);
        } else if (urlData?.signedUrl) {
          videoUrl = urlData.signedUrl;
        }
      } catch (err) {
        console.error('Exception creating signed URL:', err);
      }
    }

    return {
      recording: {
        ...recording,
        notes,
        videoUrl
      }
    };
  } catch (err) {
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to load recording');
  }
}
