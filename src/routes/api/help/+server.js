import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';


const URL = env.N8N_WEBHOOK_URL;



export async function POST({ request }) {
	try {
		const { message, sessionId, mode , name, email} = await request.json();

		if (!message || !sessionId ) {
			console.error("[HELP API] Missing fields", { message, sessionId, mode , name, email});
			return json({ error: "Missing fields" }, { status: 400 });
		}

		const payload = [
			{
				chatInput: message,
				sessionId,
				mode,
                name,
                email
			}
		];

		console.log("[HELP API] → n8n payload", payload);

		const res = await fetch(URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});

		const data = await res.json().catch(() => null);

		console.log("[HELP API] ← n8n response", data);

		return json({
			reply: data?.output ?? "No response from bot."
		});
	} catch (err) {
		console.error("[HELP API] ERROR", err);
		return json(
			{ reply: "Error contacting help assistant." },
			{ status: 500 }
		);
	}
}
