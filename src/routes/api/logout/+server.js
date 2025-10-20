import { redirect } from '@sveltejs/kit';

export async function GET({ cookies }) {
	cookies.delete('user', { path: '/' });
	console.log('🔴 Session cleared, user logged out');
	throw redirect(302, '/');
}
    