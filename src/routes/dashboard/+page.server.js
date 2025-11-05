import { redirect } from '@sveltejs/kit';
import { getUpcomingAppointments } from '$lib/ghl.js';

export async function load({ locals, cookies }) {
	if (!locals.user) throw redirect(302, '/');

	const { id, calendarLink } = locals.user;

	// ✅ get timezone if set, otherwise null
	const tz = cookies.get("tz") || null;

	const appointments = await getUpcomingAppointments(id, tz);

	return {
		user: locals.user,
		appointments,
		calendarLink,
		tz
	};
}
