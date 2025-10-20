const BASE_URL = 'https://services.leadconnectorhq.com';
const API_KEY = "pit-a01dfa57-c97c-445b-881e-fda308798116"; // set via env

// src/lib/ghl.js
export async function getContactByEmail(email) {
	const apiKey = "pit-a01dfa57-c97c-445b-881e-fda308798116";
	const url = 'https://services.leadconnectorhq.com/contacts/search';

	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
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
		const upcoming = [];

		for (const e of result.events) {
			if (!e) continue;

			// Skip cancelled appointments
			if (e.appointmentStatus?.toLowerCase() !== 'confirmed') continue;

			// Parse and format time
			let formatted = 'Unknown time';
			try {
				const start = new Date(e.startTime);
				if (!isNaN(start)) {
					formatted = start.toLocaleString('en-US', {
						weekday: 'short',
						month: 'short',
						day: 'numeric',
						hour: 'numeric',
						minute: '2-digit'
					});
				}
			} catch (tErr) {
				console.warn('⚠️ Invalid date format:', e.startTime);
			}

			upcoming.push({
				title: e.title || 'Session',
				startTime: formatted,
				address: e.address || 'No link',
				cancelLink: `https://api.leadconnectorhq.com/widget/cancel-booking?event_id=${e.id}`,
				teacher: e.assignedUserId || 'TBD'
			});
		}

		console.log(`✅ Found ${upcoming.length} upcoming appointments.`);
		return upcoming;
	} catch (err) {
		console.error('❌ Error inside getUpcomingAppointments():', err);
		return [];
	}
}