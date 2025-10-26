// src/routes/api/onboarding/+server.js
import { json } from '@sveltejs/kit';

/**
 * Simple endpoint to update the onboarding flag in session cookie.
 */
export async function POST({ request, cookies }) {
	try {
		const { onboarding } = await request.json();
		const userCookie = cookies.get('user');

		if (!userCookie) {
			console.warn('⚠️ Tried to update onboarding with no session.');
			return json({ error: 'No active session' }, { status: 401 });
		}

		const user = JSON.parse(userCookie);
		user.onboarding = onboarding ?? false;

		cookies.set('user', JSON.stringify(user), {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 14 // 14 days
		});

		console.log(`✅ Updated onboarding to ${user.onboarding} for ${user.email}`);
		return json({ success: true });
	} catch (err) {
		console.error('❌ Error updating onboarding flag:', err);
		return json({ error: 'Failed to update onboarding flag' }, { status: 500 });
	}
}
