import { json } from '@sveltejs/kit';
import { getContactByEmail } from '$lib/ghl.js';
import { getCalendarLink } from '$lib/calendars.js';
import { getFlashcardLinks } from '$lib/flashcards.js';

export async function POST({ request, cookies }) {
	const { email, code } = await request.json();

	if (!email || !code) {
		return json({ error: 'Missing email or code.' }, { status: 400 });
	}

	// ✅ Check if the code is valid (uncomment if you have OTP validation)
	// const valid = await verifyCode(email, code);
	// if (!valid) return json({ error: 'Invalid code.' }, { status: 401 });

	const contact = await getContactByEmail(email);
	if (!contact) {
		return json({ error: 'Contact not found in GHL.' }, { status: 404 });
	}

	// ✅ Get their calendar link based on level
	const calendarLink = getCalendarLink(contact.level);

	
	const flashcards = getFlashcardLinks(contact.level);

	// ✅ Store everything in the session cookie
	cookies.set(
		'user',
		JSON.stringify({
			email: contact.email,
			name: contact.firstName,
			id: contact.id,
			level: contact.level,
			calendarLink,
			flashcards // ← { share, deck }
		}),
		{
			path: '/',
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 14
		}
	);

	return json({ success: true });
}
