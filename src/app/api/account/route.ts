import { NextResponse } from "next/server";
import { getSessionUserForRequest } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getSessionUserForRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json({
    userId: user.id,
    tier: user.tier,
    ageVerified: user.ageVerified,
    terminated: user.terminated,
    dailyMessageCount: user.dailyMessageCount,
  });
}