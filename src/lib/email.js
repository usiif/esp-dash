// src/lib/email.js

/**
 * Generate a 4-character verification code.
 */
// src/lib/utils.js
export function generateCode() {
	const digits = '0123456789';
	let code = '';
	for (let i = 0; i < 6; i++) {
		code += digits.charAt(Math.floor(Math.random() * digits.length));
	}
	return code;
}

/**
 * Send an email using SMTP2GO.
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} body - Email text body.
 * @returns {Promise<boolean>} true if sent successfully, false otherwise.
 */
export async function sendEmail(to, subject, body) {
	const apiKey = "api-6A5EE9FE7D2C424FAA6FF5C0F127A432"; // store in .env
	const sender = "tools@usif.online";  // e.g. "noreply@yourdomain.com"

	if (!apiKey || !sender) {
		console.error('❌ SMTP2GO not configured: missing API key or sender.');
		return false;
	}

	try {
		const res = await fetch('https://api.smtp2go.com/v3/email/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Smtp2go-Api-Key': apiKey
			},
			body: JSON.stringify({
				sender,
				to: [to],
				subject,
				text_body: body
			})
		});

		if (!res.ok) {
			console.error('❌ Failed to send email:', res.status, await res.text());
			return false;
		}

		const data = await res.json();
		console.log('📧 SMTP2GO response:', data);
		return true;
	} catch (err) {
		console.error('❌ Email send error:', err);
		return false;
	}
}
