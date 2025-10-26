// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import { env } from '$env/dynamic/private';

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

// Store a code for an email (expires in 10 minutes)
export async function storeCode(email, code) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("auth_codes")
    .upsert({ email, code, expires_at: expiresAt });

  if (error) {
    console.error("❌ Error storing code:", error.message);
    return false;
  }

  console.log(`💾 Stored code ${code} for ${email} (expires in 10min)`);
  return true;
}

// Verify a code
export async function verifyCode(email, input) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("auth_codes")
    .select("code, expires_at")
    .eq("email", email)
    .single();

  if (error || !data) {
    console.warn("⚠️ No code found for", email);
    return false;
  }

  if (new Date(data.expires_at) < new Date(now)) {
    console.warn("⚠️ Code expired for", email);
    return false;
  }

  if (data.code !== input) {
    console.warn("❌ Wrong code entered for", email);
    return false;
  }

  // Delete code after successful verification
  await supabase.from("auth_codes").delete().eq("email", email);

  return true;
}

/**
 * Store a magic link token (expires in 48h)
 */
// src/lib/supabase.js
export async function storeMagicLink(
  email,
  token,
  portalMagic = null,
  level = null
) {
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const { data, error } = await supabase
    .from("magic_links")
    .insert([
      {
        email,
        token,
        portal_magic: portalMagic,
        level,
        expires_at: expiresAt.toISOString(),
      },
    ]);

  if (error) {
    console.error("❌ Error storing magic link:", error);
    throw error;
  }

  console.log(
    `💾 Stored magic link for ${email} (level: ${level || "unknown"})`
  );
  return data;
}

/**
 * Verify and consume a magic link token
 */
export async function verifyMagicLink(token) {
  const { data, error } = await supabase
    .from("magic_links")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .single();

  if (error || !data) {
    console.warn("⚠️ Invalid or expired magic link:", token);
    return null;
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    console.warn("⏰ Magic link expired for:", data.email);
    return null;
  }

  // Mark as used
  await supabase.from("magic_links").update({ used: true }).eq("id", data.id);

  return {
    email: data.email,
  };
}
