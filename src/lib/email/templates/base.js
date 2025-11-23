/**
 * Base email layout wrapper
 * Provides consistent styling and structure for all emails
 */
export function baseLayout(content, options = {}) {
	const { preheader = '' } = options;

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<!--[if mso]>
	<noscript>
		<xml>
			<o:OfficeDocumentSettings>
				<o:PixelsPerInch>96</o:PixelsPerInch>
			</o:OfficeDocumentSettings>
		</xml>
	</noscript>
	<![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
	${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>` : ''}
	<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
		<tr>
			<td align="center" style="padding: 40px 20px;">
				<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					${content}
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`.trim();
}

/**
 * Email header component
 */
export function header(title) {
	return `
<tr>
	<td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e5e5;">
		<h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">${title}</h1>
	</td>
</tr>
`.trim();
}

/**
 * Email footer component
 */
export function footer(message = 'Saludos,<br><strong>The Expat Spanish Team</strong>') {
	return `
<tr>
	<td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
		<p style="margin: 0; font-size: 14px; line-height: 20px; color: #6b7280; text-align: center;">
			${message}
		</p>
	</td>
</tr>
`.trim();
}

/**
 * Primary button component
 */
export function button(href, text, color = '#f97316') {
	return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
	<tr>
		<td align="center">
			<a href="${href}" style="display: inline-block; padding: 12px 32px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">${text}</a>
		</td>
	</tr>
</table>
`.trim();
}

/**
 * Info box component (for callouts, notices, etc.)
 */
export function infoBox(content, color = '#fef3c7', borderColor = '#f59e0b', textColor = '#92400e') {
	return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
	<tr>
		<td style="padding: 16px; background-color: ${color}; border-left: 4px solid ${borderColor}; border-radius: 4px;">
			<div style="margin: 0; font-size: 14px; line-height: 20px; color: ${textColor};">
				${content}
			</div>
		</td>
	</tr>
</table>
`.trim();
}

/**
 * Key-value details table
 */
export function detailsTable(items) {
	const rows = items
		.map(
			({ label, value }) => `
		<tr>
			<td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 80px; vertical-align: top;">${label}:</td>
			<td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${value}</td>
		</tr>
	`.trim()
		)
		.join('\n');

	return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 24px;">
	<tr>
		<td style="padding: 20px;">
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
				${rows}
			</table>
		</td>
	</tr>
</table>
`.trim();
}

/**
 * Paragraph component
 */
export function paragraph(text, styles = {}) {
	const defaultStyles = {
		margin: '0 0 24px',
		fontSize: '16px',
		lineHeight: '24px',
		color: '#374151',
		...styles
	};

	const styleString = Object.entries(defaultStyles)
		.map(([key, value]) => {
			const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			return `${cssKey}: ${value}`;
		})
		.join('; ');

	return `<p style="${styleString}">${text}</p>`;
}

/**
 * Small text / caption component
 */
export function caption(text, styles = {}) {
	const defaultStyles = {
		margin: '0 0 8px',
		fontSize: '14px',
		lineHeight: '20px',
		color: '#6b7280',
		...styles
	};

	const styleString = Object.entries(defaultStyles)
		.map(([key, value]) => {
			const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			return `${cssKey}: ${value}`;
		})
		.join('; ');

	return `<p style="${styleString}">${text}</p>`;
}

/**
 * Link component
 */
export function link(href, text, styles = {}) {
	const defaultStyles = {
		color: '#2563eb',
		textDecoration: 'none',
		fontSize: '14px',
		...styles
	};

	const styleString = Object.entries(defaultStyles)
		.map(([key, value]) => {
			const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			return `${cssKey}: ${value}`;
		})
		.join('; ');

	return `<a href="${href}" style="${styleString}">${text}</a>`;
}
