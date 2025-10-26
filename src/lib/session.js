// src/lib/session.js
export function updateOnboardingFlag(cookies, value = false) {
    const userCookie = cookies.get('user');
    if (!userCookie) {
      console.warn('⚠️ No user session found while updating onboarding flag.');
      return false;
    }
  
    try {
      const user = JSON.parse(userCookie);
      user.onboarding = value;
  
      cookies.set('user', JSON.stringify(user), {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 14 // 14 days
      });
  
      console.log(`✅ Onboarding flag updated to ${value} for ${user.email}`);
      return true;
    } catch (err) {
      console.error('❌ Failed to update onboarding flag:', err);
      return false;
    }
  }
  