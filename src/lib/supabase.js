// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
	"https://vvvfccjkejzxhtrqczhm.supabase.co",
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dmZjY2prZWp6eGh0cnFjemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTE5ODcsImV4cCI6MjA3NjQ2Nzk4N30.l3fCdFhX_5WVGa95BjDd7Qrv1sODhFBO_LrwAajzvQc"
);

// Store a code for an email (expires in 10 minutes)
export async function storeCode(email, code) {
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

	const { error } = await supabase
		.from('auth_codes')
		.upsert({ email, code, expires_at: expiresAt });

	if (error) {
		console.error('❌ Error storing code:', error.message);
		return false;
	}

	console.log(`💾 Stored code ${code} for ${email} (expires in 10min)`);
	return true;
}

// Verify a code
export async function verifyCode(email, input) {
	const now = new Date().toISOString();

	const { data, error } = await supabase
		.from('auth_codes')
		.select('code, expires_at')
		.eq('email', email)
		.single();

	if (error || !data) {
		console.warn('⚠️ No code found for', email);
		return false;
	}

	if (new Date(data.expires_at) < new Date(now)) {
		console.warn('⚠️ Code expired for', email);
		return false;
	}

	if (data.code !== input) {
		console.warn('❌ Wrong code entered for', email);
		return false;
	}

	// Delete code after successful verification
	await supabase.from('auth_codes').delete().eq('email', email);

	return true;
}
