import { redirect } from '@sveltejs/kit';
import { getUpcomingAppointments } from '$lib/ghl.js';
import { getCalendarsForLevel } from '$lib/calendars.js';

export async function load({ locals }) {
	if (!locals.user) throw redirect(302, '/');

	const { id, level } = locals.user;

	console.log('🧭 Loading dashboard for:', locals.user.email);
	console.log('📘 Level:', level);

	const appointments = await getUpcomingAppointments(id);
	const calendars = getCalendarsForLevel(level);

	console.log('✅ Appointments:', appointments.length);
	console.log('✅ Calendars:', calendars.length);

	return {
		user: locals.user,
		appointments,
		calendars
	};
}
