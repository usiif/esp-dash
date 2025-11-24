/**
 * Class Cancellation Email Template
 */

import { baseLayout, header, paragraph, detailsTable, link, caption, footer } from './base.js';

/**
 * Format a date/time for display in email
 */
function formatDate(isoString, timezone = 'UTC') {
  const date = new Date(isoString);

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
 * Generate class cancellation confirmation email
 */
export function classCancellationTemplate(data) {
  const {
    studentName,
    className,
    teacherName,
    startsAt,
    durationMinutes,
    topic,
    timezone = 'UTC'
  } = data;

  const formattedDate = formatDate(startsAt, timezone);

  const text = `
Hi ${studentName},

Your reservation for "${className}" has been cancelled.

Class Details:
Time: ${formattedDate}
Duration: ${durationMinutes} minutes
Teacher: ${teacherName}
${topic ? `Topic: ${topic}` : ''}

You can book another class anytime from your dashboard:
https://my.expatspanishlessons.com/dashboard

If you cancelled by mistake, you can re-book this class if spots are still available.

- Expat Spanish
  `;

  const bodyContent = `
<tr>
	<td style="padding: 32px;">
		${paragraph(`Hi ${studentName},`)}
		${paragraph(`Your reservation for <strong>"${className}"</strong> has been cancelled.`)}

		${detailsTable([
			{ label: 'Time', value: formattedDate },
			{ label: 'Duration', value: `${durationMinutes} minutes` },
			{ label: 'Teacher', value: teacherName },
			...(topic ? [{ label: 'Topic', value: topic }] : [])
		])}

		${paragraph('If you cancelled by mistake, you can re-book this class from your dashboard if spots are still available.')}

		<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
			<tr>
				<td>
					${caption('Want to book another class?')}
					<p style="margin: 0 0 24px;">
						${link('https://my.expatspanishlessons.com/classes', 'Browse Classes →', { fontWeight: '500' })}
					</p>
				</td>
			</tr>
		</table>
	</td>
</tr>
`.trim();

  const html = baseLayout(
    header('❌ Class Cancelled') + '\n' + bodyContent + '\n' + footer(),
    { preheader: `Your reservation for ${className} has been cancelled` }
  );

  const subject = `❌ Class Cancelled: ${className}`;

  return { subject, text, html };
}
