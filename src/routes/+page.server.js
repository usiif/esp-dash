// src/routes/+page.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// If a user session exists, skip the login page entirely
	if (locals.user) {
		console.log('🟢 Existing session found for', locals.user.email, '- redirecting to /dashboard');
		throw redirect(302, '/dashboard');
	}
}
