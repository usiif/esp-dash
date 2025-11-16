import { json } from "@sveltejs/kit";

export async function POST({ request, cookies }) {
  const { tz } = await request.json();

  if (!tz) return json({});

  cookies.set(
    "tz",
    tz,
    {
      path: "/",
      httpOnly: false, // browser must access it
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    }
  );

  return json({ ok: true });
}
