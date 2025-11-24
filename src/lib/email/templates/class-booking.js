import { baseLayout, header, footer, button, infoBox, detailsTable, paragraph, caption, link } from './base.js';

/**
 * Format a date for display in emails
 */
function formatDate(isoDate, timezone = 'UTC') {
	const date = new Date(isoDate);

	// Format date and time without timezone
	const dateTimeOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZone: timezone
	};
	const dateTimeStr = date.toLocaleString('en-US', dateTimeOptions);

	// Get timezone name using Intl.DateTimeFormat
	const tzName = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		timeZoneName: 'long'
	}).formatToParts(date)
		.find(part => part.type === 'timeZoneName')?.value || timezone;

	return `${dateTimeStr} (${tzName})`;
}

/**
 * Generate Google Calendar link
 */
function generateGoogleCalendarLink(data) {
	const startDate = new Date(data.startsAt);
	const endDate = new Date(startDate.getTime() + data.durationMinutes * 60000);

	const formatDate = (date) => {
		return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
	};

	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: data.className,
		dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
		details: `Topic: ${data.topic || 'Spanish Class'}\nTeacher: ${data.teacherName}\n\nJoin via Zoom: ${data.zoomLink}\n\nView your dashboard: https://my.expatspanishlessons.com/dashboard`,
		location: 'Zoom (Online)',
		trp: 'false'
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate iCal/Outlook calendar file content
 */
function generateICalContent(data) {
	const startDate = new Date(data.startsAt);
	const endDate = new Date(startDate.getTime() + data.durationMinutes * 60000);

	const formatDate = (date) => {
		return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
	};

	const now = formatDate(new Date());

	return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Expat Spanish Lessons//Class Booking//EN
BEGIN:VEVENT
UID:class-${data.classId || 'booking'}-${now}@expatspanishlessons.com
DTSTAMP:${now}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${data.className}
DESCRIPTION:Topic: ${data.topic || 'Spanish Class'}\\nTeacher: ${data.teacherName}\\n\\nJoin via Zoom: ${data.zoomLink}\\n\\nView your dashboard: https://my.expatspanishlessons.com/dashboard
LOCATION:Zoom (Online)
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

/**
 * Class booking confirmation email template
 * @param {object} data - Email data
 * @param {string} data.studentName - Student's first name
 * @param {string} data.className - Class title
 * @param {string} data.teacherName - Teacher's name
 * @param {string} data.startsAt - ISO date string
 * @param {number} data.durationMinutes - Class duration
 * @param {string} data.topic - Class topic
 * @param {string} data.zoomLink - Zoom meeting link
 * @param {string} data.timezone - Timezone (default: UTC)
 * @param {string} [data.classId] - Optional class ID
 * @returns {object} { subject, text, html }
 */
export function classBookingTemplate(data) {
	const {
		studentName,
		className,
		teacherName,
		startsAt,
		durationMinutes,
		topic,
		zoomLink,
		timezone = 'UTC',
		classId
	} = data;

	const formattedDate = formatDate(startsAt, timezone);
	const googleCalLink = generateGoogleCalendarLink(data);
	const iCalContent = generateICalContent(data);
	const iCalDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(iCalContent)}`;

	const subject = `✅ Class Confirmed: ${className}`;

	// Plain text version
	const text = `
Hi ${studentName},

Your spot in "${className}" has been confirmed!

Class Details:
- Time: ${formattedDate}
- Duration: ${durationMinutes} minutes
- Teacher: ${teacherName}
- Topic: ${topic || 'Spanish Class'}

Join via Zoom: ${zoomLink}

Add to your calendar:
- Google Calendar: ${googleCalLink}
- Outlook/iCal: Download from your dashboard

Need help getting started? Watch this quick tutorial:
https://www.loom.com/share/abc123tutorial

View all your classes: https://my.expatspanishlessons.com/dashboard

See you in class!

Saludos,
The Expat Spanish Team
`.trim();

	// HTML version using components
	const bodyContent = `
<tr>
	<td style="padding: 32px;">
		${paragraph(`Hi ${studentName},`)}
		${paragraph(`Your spot in <strong>"${className}"</strong> has been confirmed!`)}

		${detailsTable([
			{ label: 'Time', value: formattedDate },
			{ label: 'Duration', value: `${durationMinutes} minutes` },
			{ label: 'Teacher', value: teacherName },
			{ label: 'Topic', value: topic || 'Spanish Class' },
			{ label: 'Zoom Link', value: `<a href="${zoomLink}" style="color: #2563eb; text-decoration: none; font-weight: 500;">Join Class →</a>` }
		])}

		${paragraph('See you in class!')}

		<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
			<tr>
				<td>
					${caption('Want to view all your upcoming classes, book or cancel?')}
					<p style="margin: 0 0 24px;">
						${link('https://my.expatspanishlessons.com/dashboard', 'View Dashboard →', { fontWeight: '500' })}
					</p>
				</td>
			</tr>
		</table>

		<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding-top: 16px; border-top: 1px solid #e5e5e5;">
			<tr>
				<td>
					${caption('Add to your calendar:', { margin: '0 0 8px' })}
					<p style="margin: 0; font-size: 14px; line-height: 20px;">
						${link(googleCalLink, '+ Google Calendar')}
						<span style="color: #6b7280; margin: 0 8px;">•</span>
						<a href="${iCalDataUri}" download="class-booking.ics" style="color: #2563eb; text-decoration: none; font-size: 14px;">+ Outlook/iCal</a>
					</p>
				</td>
			</tr>
		</table>
	</td>
</tr>
`.trim();

	const html = baseLayout(
		header('✅ Class Confirmed!') + '\n' + bodyContent + '\n' + footer(),
		{ preheader: `Your spot in ${className} is confirmed!` }
	);

	return { subject, text, html };
}
