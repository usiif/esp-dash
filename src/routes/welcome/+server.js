import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { getContactByEmail } from '$lib/ghl.js';
import { getCalendarLink } from '$lib/calendars.js';
import { getFlashcardLinks } from '$lib/flashcards.js';

export async function GET({ url, cookies }) {
	const token = url.searchParams.get('token');
	if (!token) {
		console.warn('⚠️ Missing token in /welcome request');
		throw redirect(302, '/');
	}

	console.log(`🔑 Verifying magic token: ${token}`);

	try {
		// 1️⃣ Look up the token in Supabase
		const { data, error } = await supabase
			.from('magic_links')
			.select('*')
			.eq('token', token)
			.single();

		if (error || !data) {
			console.error('❌ Invalid or missing token:', error || 'No record found.');
			throw redirect(302, '/');
		}

		// 2️⃣ Check expiration
		const now = new Date();
		const expiresAt = new Date(data.expires_at);
		if (expiresAt < now) {
			console.warn(`⏰ Token expired for ${data.email}`);
			throw redirect(302, '/');
		}

		// 3️⃣ Fetch user details from GHL
		const contact = await getContactByEmail(data.email);
		if (!contact) {
			console.warn(`❌ Contact not found in GHL for ${data.email}`);
			throw redirect(302, '/');
		}

		// 4️⃣ Get resources based on their level
		const calendarLink = getCalendarLink(contact.level);
		const flashcards = getFlashcardLinks(contact.level);

		console.log(`📧 User verified: ${contact.firstName} (${contact.level || 'N/A'})`);

		// 5️⃣ Create session cookie
		cookies.set(
			'user',
			JSON.stringify({
				email: contact.email,
				name: contact.firstName,
				id: contact.id,
				level: contact.level,
				calendarLink,
				flashcards, // 🧠 Added Flashcards here
				portal_magic: data.portal_magic || null,
				onboarding: 'intro' // 🧭 Flag for first-time tutorial
			}),
			{
				path: '/',
				httpOnly: true,
				maxAge: 60 * 60 * 24 * 14 // 14 days
			}
		);

		console.log(`✅ Session created for ${contact.email}`);
		throw redirect(302, '/dashboard');
	} catch (err) {
		console.error('🔥 Error in /welcome handler:', err);
		throw redirect(302, '/');
	}
}
