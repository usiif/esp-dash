// src/routes/api/webhook/+server.js
import { json } from '@sveltejs/kit';
import { sendMagicLink } from '$lib/email.js';
import { storeMagicLink } from '$lib/supabase.js';
import { generateToken } from '$lib/utils.js';
import { env } from '$env/dynamic/private';

const WEBHOOK_SECRET = env.WEBHOOK_SECRET; // 

export async function POST({ request }) {
	let payload;

	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	// ✅ Secret validation (required)
	const secret = payload?.customData?.secret;
	if (secret !== WEBHOOK_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	// ✅ Extract useful fields
	const email = payload.email || payload.Email;
	const name = payload.first_name || payload.full_name || 'Student';
	const level = payload['Access Level'] || payload['AI Recommended Level'] || 'Level 1';
	const portalMagic = payload?.customData?.portal_magic || null;

	if (!email) {
		return json({ error: 'Missing email' }, { status: 400 });
	}

	try {
		const token = generateToken();

		// Save to Supabase (token + portal + level)
		await storeMagicLink(email, token, portalMagic, level);

		// Send welcome + magic link email
		await sendMagicLink(email, token, name);

		return json({ success: true });
	} catch {
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
