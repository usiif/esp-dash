import { redirect } from '@sveltejs/kit';
import { getUpcomingAppointments } from '$lib/ghl.js';

export async function load({ locals }) {



	return {
		user: locals.user,
	};
}
