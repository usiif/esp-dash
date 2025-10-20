// src/routes/api/send-code/+server.js
import { json } from '@sveltejs/kit';
import { generateCode, sendEmail } from '$lib/email.js';
import { storeCode } from '$lib/supabase.js';
import { getContactByEmail } from '$lib/ghl.js'; // ✅ Import GHL check

export async function POST({ request }) {
	const { email } = await request.json();

	// 1️⃣ Basic email validation
	if (!email || !email.includes('@')) {
		return json({ error: 'Enter a valid email address.' }, { status: 400 });
	}

	try {
		// 2️⃣ Verify the contact exists in CRM before sending anything
		const contact = await getContactByEmail(email);

		if (!contact || !contact.id) {
			console.warn(`⚠️ Blocked email attempt - not in CRM: ${email}`);
			return json({ error: "You're not in our CRM brother 😅" }, { status: 404 });
		}

		// 3️⃣ Generate a 6-digit verification code
		const code = generateCode();

		// 4️⃣ Store in Supabase for verification
		await storeCode(email, code);

		// 5️⃣ Compose and send the email
		const subject = 'Your Verification Code';
		const body = `
Hola ${contact.firstName || ''} 👋,

Your Spanish Journey login code is:

👉 ${code}

It expires in 10 minutes.

¡Vamos!
		`;

		const sent = await sendEmail(email, subject, body);

		if (!sent) {
			console.error(`❌ Failed to send code to ${email}`);
			return json({ error: 'Failed to send email.' }, { status: 500 });
		}

		console.log(`📩 Code sent successfully to verified CRM user: ${email}`);

		return json({ success: true });
	} catch (err) {
		console.error('❌ Error in /api/send-code:', err);
		return json({ error: 'Server error. Please try again later.' }, { status: 500 });
	}
}
