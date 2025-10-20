// src/routes/api/verify-code/+server.js
import { json } from '@sveltejs/kit';
import { verifyCode } from '$lib/supabase.js';
import { getContactByEmail } from '$lib/ghl.js';

export async function POST({ request, cookies }) {
	const { email, code } = await request.json();

	if (!email || !code) {
		return json({ error: 'Missing email or code.' }, { status: 400 });
	}

	const valid = await verifyCode(email, code);
	if (!valid) {
		return json({ error: 'Invalid or expired code.' }, { status: 401 });
	}

	// Retrieve full contact info from GHL (now that we trust the user)
	const contact = await getContactByEmail(email);

	if (!contact) {
		return json({ error: 'Contact not found in GHL.' }, { status: 404 });
	}

	// ✅ Create final session
	cookies.set(
		'user',
		JSON.stringify({
			email: contact.email,
			name: contact.firstName,
			id: contact.id,
			level: contact.level
		}),
		{
			path: '/',
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 14 // 14 days
		}
	);

	return json({ success: true });
}
