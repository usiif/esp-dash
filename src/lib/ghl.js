import { env } from '$env/dynamic/private';

const API_KEY = env.GHL_API_KEY;


// src/lib/ghl.js
export async function getContactByEmail(email) {
	const url = 'https://services.leadconnectorhq.com/contacts/search';

	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				'Version': '2021-07-28',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				locationId: 'Wpw7KRwapxKDboseXO64',
				page: 1,
				pageLimit: 1,
				query: email
			})
		});

		if (!res.ok) {
			console.error('❌ GHL returned non-OK status:', res.status);
			return null;
		}

		const data = await res.json();

		// Make sure we actually got something
		if (!data.contacts || data.contacts.length === 0) {
			console.warn('⚠️ No contact found for', email);
			return null;
		}

		const c = data.contacts[0];
		return {
			id: c.id,
			email: c.email,
			firstName: c.firstName || 'Student',
			level: c.customFields?.find(f => f.id === '6YOHqCErE24toqUlYeU9')?.value || 'Unknown'
		};
	} catch (err) {
		console.error('❌ Error fetching contact:', err);
		return null; e
	}
}
export async function getUpcomingAppointments(contactID) {
	if (!contactID) {
		console.error('❌ getUpcomingAppointments called without contact ID');
		return [];
	}

	const url = `https://services.leadconnectorhq.com/contacts/${contactID}/appointments`;
	console.log(`📡 Fetching appointments for contact ID: ${contactID}`);

	try {
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				Version: '2021-07-28'
			}
		});

		console.log('📬 GHL response status:', res.status);

		if (!res.ok) {
			const errText = await res.text();
			console.error(`❌ GHL returned ${res.status}:`, errText);
			return [];
		}

		const result = await res.json();
		

		if (!result || !Array.isArray(result.events)) {
			console.warn('⚠️ GHL response missing events array:', result);
			return [];
		}

		const now = new Date();
		const GRACE_AFTER_END_HOURS = 2;
		const DEFAULT_DURATION_MIN = 60;
		const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const upcoming = [];

		for (const e of result.events) {
			if (!e) continue;

			// ✅ Handle GHL typo (appointmentStatus vs appoinmentStatus)
			const statusRaw = (e.appointmentStatus || e.appoinmentStatus || '').toLowerCase();
			if (statusRaw !== 'confirmed') continue;

			const start = parseCST(e.startTime);
			let end = e.endTime ? parseCST(e.endTime) : null;

			if (!start) continue;
			if (!end) {
				end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60 * 1000);
			}

			// ✅ Visibility logic
			const visibleUntil = new Date(end.getTime() + GRACE_AFTER_END_HOURS * 60 * 60 * 1000);
			if (visibleUntil < now) continue;

			// ✅ Determine status label for dashboard
			let uiStatus = 'Upcoming';
			if (now >= start && now <= end) uiStatus = 'In Progress';
			if (now > end) uiStatus = 'Completed';

			const formattedStart = start.toLocaleString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});

			upcoming.push({
				title: e.title || 'Session',
				startTime: formattedStart,
				startDate: start,
				endDate: end,
				status: uiStatus,   // ✅ NEW
				address: e.address || 'No link',
				cancelLink: `https://api.leadconnectorhq.com/widget/cancel-booking?event_id=${e.id}`,
				teacher: e.assignedUserId || 'TBD',
				calendarTZ: "America/Chicago",
				localTZ: userTZ
			});
		}

		console.log(`✅ Showing ${upcoming.length} appointment(s)`);

		return upcoming;
	} catch (err) {
		console.error('❌ Error inside getUpcomingAppointments():', err);
		return [];
	}
}



// Parse GHL time as CST and convert to local Date
function parseCST(dateStr) {
	// Ensure format "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
	const normalized = dateStr.replace(' ', 'T');

	// Append CST offset — CST = UTC-6 (no DST handling from GHL)
	// If DST becomes a problem later, we can switch to tz library
	const withTZ = normalized + "-06:00";

	const d = new Date(withTZ);

	if (isNaN(d.getTime())) {
		console.warn("⚠️ Could not parse CST timestamp:", dateStr);
		return null;
	}
	return d;
}
