// src/routes/api/webhook/+server.js
import { json } from '@sveltejs/kit';
import { sendMagicLink } from '$lib/email.js';
import { storeMagicLink } from '$lib/supabase.js';
import { generateToken } from '$lib/utils.js';

export async function POST({ request }) {
  console.log('📩 Incoming webhook from GHL');

  let payload;
  try {
    payload = await request.json();
    console.log('🔍 Raw payload received:', JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('❌ Failed to parse JSON payload:', err);
    return json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Extract useful fields
  const email = payload.email || payload.Email || null;
  const name = payload.first_name || payload.full_name || 'Friend';
  const level = payload['Access Level'] || payload['AI Recommended Level'] || 'Level 1';
  const contactId = payload.contact_id || null;
  const portalMagic = payload?.customData?.portal_magic || null;

  console.log(`📧 Preparing magic link for ${name} (${email})`);
  console.log(`🧠 Access Level: ${level}`);
  console.log(`🆔 Contact ID: ${contactId}`);
  console.log(`✨ Portal Magic Link: ${portalMagic || 'none provided'}`);

  try {
    if (!email) {
      console.warn('⚠️ Missing email, skipping sendMagicLink');
      return json({ error: 'Missing email in payload' }, { status: 400 });
    }

    const token = generateToken();
    console.log(`🪄 Generated token: ${token}`);

    // Store in Supabase (storeMagicLink now accepts portalMagic)
    await storeMagicLink(email, token, portalMagic, level);
    console.log('💾 Token + PortalMagic stored successfully in Supabase.');

    // Send the email (includes portal link if available)
    await sendMagicLink(email, token, name, portalMagic);
    console.log(`✅ Magic link sent to ${email}`);

    return json({ success: true });
  } catch (err) {
    console.error('🔥 Error processing webhook:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
