// src/routes/api/onboarding/+server.js
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
  try {
    const { onboarding } = await request.json(); // e.g. "password_set" or "complete"
    if (!onboarding) return json({ error: 'Missing onboarding state' }, { status: 400 });

    const session = cookies.get('user');
    if (!session) return json({ error: 'No session found' }, { status: 401 });

    const user = JSON.parse(session);
    user.onboarding = onboarding;

    cookies.set('user', JSON.stringify(user), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 14
    });

    console.log(`✅ Onboarding state updated to "${onboarding}"`);
    return json({ success: true });
  } catch (err) {
    console.error('❌ Failed to update onboarding:', err);
    return json({ error: 'Server error' }, { status: 500 });
  }
}
