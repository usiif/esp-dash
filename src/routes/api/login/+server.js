// src/routes/api/login/+server.js
import { json } from '@sveltejs/kit';
import { getContactByEmail } from '$lib/ghl.js';

import { storeCode } from '$lib/supabase.js';
import { sendCode } from '$lib/email.js';

export async function POST({ request }) {
	const { email } = await request.json();

	// 1️⃣ Validate email format first
	if (!email || !email.includes('@')) {
		return json({ error: 'Enter a valid email address.' }, { status: 400 });
	}

	try {
		// 2️⃣ Attempt to locate the contact in GHL
		const contact = await getContactByEmail(email);

		if (!contact || !contact.id) {
			console.warn(`⚠️ Email not found in CRM: ${email}`);
			return json({ error: "You're not in our CRM brother 😅" }, { status: 404 });
		}

		// 3️⃣ Generate a 6-digit verification code
		
		// 4️⃣ Store it in Supabase for verification
		await storeCode(email, code);

		// 5️⃣ Send verification email (only after confirmed CRM match)
		await sendCode(email, code);

		console.log(`📩 Code ${code} sent to verified CRM contact: ${email}`);

		return json({ success: true });
	} catch (err) {
		console.error('❌ Login error:', err);
		return json({ error: 'Server error. Please try again later.' }, { status: 500 });
	}
}
