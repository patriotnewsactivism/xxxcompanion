import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserIdForRequest } from "@/lib/session";
import { computeAge, MINIMUM_AGE } from "@/lib/safety/ageGate";

export async function POST(request: Request) {
  let body: { dateOfBirth?: string; consent?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { dateOfBirth, consent } = body;
  if (!consent) {
    return NextResponse.json(
      { error: "You must confirm you are 18 or older." },
      { status: 400 }
    );
  }
  if (!dateOfBirth) {
    return NextResponse.json(
      { error: "Date of birth is required." },
      { status: 400 }
    );
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
  }

  if (computeAge(dob) < MINIMUM_AGE) {
    return NextResponse.json(
      { error: "You must be 18 or older to access this platform." },
      { status: 403 }
    );
  }

  const userId = await getSessionUserIdForRequest(request);
  let id = userId;

  if (id) {
    await db
      .update(users)
      .set({
        ageVerified: true,
        ageVerifiedAt: new Date(),
        verificationStatus: "self-reported",
      })
      .where(eq(users.id, id));
  } else {
    const inserted = await db
      .insert(users)
      .values({
        ageVerified: true,
        ageVerifiedAt: new Date(),
        verificationStatus: "self-reported",
      })
      .returning({ id: users.id });
    id = inserted[0].id;
  }

  const response = NextResponse.json({ ok: true });
  // Standalone flow keeps the cookie session; in Surge's iframe the
  // cookies are third-party and get dropped — the bearer token covers it.
  response.cookies.set("user_id", String(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set("age_verified", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}