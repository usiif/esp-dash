export async function handle({ event, resolve }) {
	const session = event.cookies.get('user');
	event.locals.user = session ? JSON.parse(session) : null;
	return resolve(event);
}
