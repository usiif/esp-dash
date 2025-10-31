import { redirect } from '@sveltejs/kit';
import { getUpcomingAppointments } from '$lib/ghl.js';

export async function load({ locals }) {

    if (!locals.user) throw redirect(302, '/');

	return {
		user: locals.user,
	};
}
