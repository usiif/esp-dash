import { env } from '$env/dynamic/private';


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
	const apiKey = env.SMTP2GO_API_KEY;
	const sender = env.SMTP2GO_SENDER;
	const replyto = "contact@expatspanishlessons.com"

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
				text_body: body,
				custom_headers: [
					{
						header: 'Reply-To',
						value: replyto
					}
				]
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

/**
 * Send onboarding magic link email.
 * @param {string} email - Recipient's email.
 * @param {string} token - Magic link token.
 * @param {string} name  - Recipient's first name.
 */
// src/lib/email.js

export async function sendMagicLink(email, token, name, portalMagic) {
	const link = `https://my.expatspanishlessons.com/welcome?token=${token}`;

	const subject = 'Confirm Your Account on Expat Spanish Lessons';

	const body = `
${name}, ¡Bienvenido/a a Expat Spanish!

To get started, we need to confirm your account and set your password. 

Please click this link below to start your account set up:
${link}

This link will expire in 48 hours. 

If you are unable to access your account or have any problems with logging in, please reply to this email. We monitor the inbox Mon-Saturday 9am-3pm. 

Saludos,
Expat Spanish 
`;
	return await sendEmail(email, subject, body);
}
