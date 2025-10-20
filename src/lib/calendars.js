// src/lib/calendars.js

export const LevelCalendars = {
	'Level 1': [
		{
			name: 'Listening Practice',
			link: 'https://api.leadconnectorhq.com/widget/booking/8nInwMvWp6voBHyc0iyK'
		},
		{
			name: 'Speak And Learn',
			link: 'https://api.leadconnectorhq.com/widget/booking/SAVSDZN16UlMupRGqL2G'
		},
		{
			name: 'Role Play Practice',
			link: 'https://api.leadconnectorhq.com/widget/booking/oXF0AStvqWrlvKvy9Qfu'
		}
	],
	'Level 2': [
		{
			name: 'Listening Practice',
			link: 'https://api.leadconnectorhq.com/widget/booking/rCTxcVlUQdBg3Vq0kDoT'
		},
		{
			name: 'Level 2 Classes',
			link: 'https://yourcalendar.com/intermediate-2'
		},
		{
			name: 'Speak And Learn',
			link: 'https://yourcalendar.com/intermediate-2'
		}
	],
	'Level 3': [
		{
			name: 'Level 3 - Listening Practice',
			link: 'https://api.leadconnectorhq.com/widget/booking/Prbe729zqis5QafvO8t7'
		},
		{
			name: 'Level 3 - Speak And Learn',
			link: 'https://api.leadconnectorhq.com/widget/booking/tlWTeoNwny4CfjvNP1IG'
		}
	]
};

export function getCalendarsForLevel(level) {
	console.log('🧭 Fetching calendars for level:', level);

	const calendars = LevelCalendars[level];
	if (calendars && calendars.length > 0) {
		console.log(`✅ Found ${calendars.length} calendars for ${level}`);
		return calendars;
	}

	console.warn(`⚠️ No calendars found for level: ${level}`);
	return [];
}
