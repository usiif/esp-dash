// src/routes/api/send-code/+server.js
import { json } from '@sveltejs/kit';
import { generateCode, sendEmail } from '$lib/email.js';
import { storeCode, getStudentByEmail } from '$lib/supabase.js';

export async function POST({ request }) {
  const { email } = await request.json();

  // 1️⃣ Basic email validation
  if (!email || !email.includes('@')) {
    return json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    // 2️⃣ Verify student exists in Supabase before sending a code
    const student = await getStudentByEmail(email);

    if (!student || !student.id) {
      console.warn(`⚠️ Blocked email attempt - student not found: ${email}`);
      return json({ error: "Amigo/a that email is not in our system." }, { status: 404 });
    }

    // 3️⃣ Generate a 6-digit verification code
    const code = generateCode();

    // 4️⃣ Store in Supabase for verification
    await storeCode(email, code);

    // 5️⃣ Compose email (use their student name if available)
    const name =
      student.first_name ||
      student.full_name ||
      student.email.split('@')[0];

    const subject = 'Verify Your Account';
    const body = `
Hola ${name},

To access your student dashboard: 
1. Copy this code: ${code}
2. Return to this page to enter your code

This code will expire in 30 minutes.

If you are unable to access your account or have any problems with logging in, please reply to this email. We monitor the inbox Mon-Saturday 9am-3pm.

- Expat Spanish
    `;

    const sent = await sendEmail(email, subject, body);

    if (!sent) {
      console.error(`❌ Failed to send code to ${email}`);
      return json({ error: 'Failed to send email.' }, { status: 500 });
    }

    console.log(`📩 Code sent successfully to student: ${email}`);
    return json({ success: true });

  } catch (err) {
    console.error('❌ Error in /api/send-code:', err);
    return json({ error: 'Server error. Please try again later.' }, { status: 500 });
  }
}
