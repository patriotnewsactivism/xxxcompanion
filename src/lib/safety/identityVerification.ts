import crypto from "node:crypto";

export type VerificationStatus = "pending" | "verified" | "rejected" | "not_configured";

export interface VerificationResult {
  status: VerificationStatus;
  provider: string;
  referenceId?: string;
  verificationUrl?: string;
}

const VERIFF_BASE_URL = "https://stationapi.veriff.com/v1";

function veriffConfigured(): boolean {
  return Boolean(process.env.VERIFF_API_KEY && process.env.VERIFF_SECRET_KEY);
}

function signPayload(payload: string): string {
  const secret = process.env.VERIFF_SECRET_KEY ?? "";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Starts a real Veriff verification session for a user. Falls back to a
 * clearly-labeled "not_configured" status (never a fake "verified") if
 * VERIFF_API_KEY / VERIFF_SECRET_KEY aren't set yet — matches this repo's
 * existing pattern in voice.ts (IntegrationNotConfiguredError) of refusing
 * rather than faking success when a real provider isn't wired.
 *
 * Docs: https://developers.veriff.com/#sessions
 */
export async function initiateIdentityVerification(
  userId: number
): Promise<VerificationResult> {
  if (!veriffConfigured()) {
    return { status: "not_configured", provider: "veriff" };
  }

  const payload = JSON.stringify({
    verification: {
      callback: process.env.VERIFF_CALLBACK_URL ?? "",
      vendorData: String(userId),
    },
  });

  try {
    const res = await fetch(`${VERIFF_BASE_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-CLIENT": process.env.VERIFF_API_KEY as string,
        "X-HMAC-SIGNATURE": signPayload(payload),
      },
      body: payload,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error(`[veriff] session create failed: ${res.status}`);
      return { status: "pending", provider: "veriff" };
    }

    const data = (await res.json()) as {
      verification?: { id?: string; url?: string; status?: string };
    };

    return {
      status: "pending",
      provider: "veriff",
      referenceId: data.verification?.id,
      verificationUrl: data.verification?.url,
    };
  } catch (error) {
    console.error("[veriff] session create error", error);
    return { status: "pending", provider: "veriff" };
  }
}

/**
 * Checks a session's real decision from Veriff. Used either by polling
 * this endpoint or (preferably in production) by the /api/verify-age
 * webhook route validating Veriff's signed callback directly.
 */
export async function confirmIdentityVerification(
  sessionId: string
): Promise<VerificationResult> {
  if (!veriffConfigured()) {
    return { status: "not_configured", provider: "veriff" };
  }

  try {
    const res = await fetch(`${VERIFF_BASE_URL}/sessions/${sessionId}/decision`, {
      method: "GET",
      headers: {
        "X-AUTH-CLIENT": process.env.VERIFF_API_KEY as string,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { status: "pending", provider: "veriff", referenceId: sessionId };
    }

    const data = (await res.json()) as {
      verification?: { status?: string; decisionScore?: number };
    };
    const veriffStatus = data.verification?.status;

    const status: VerificationStatus =
      veriffStatus === "approved"
        ? "verified"
        : veriffStatus === "declined" || veriffStatus === "expired" || veriffStatus === "abandoned"
          ? "rejected"
          : "pending";

    return { status, provider: "veriff", referenceId: sessionId };
  } catch (error) {
    console.error("[veriff] decision fetch error", error);
    return { status: "pending", provider: "veriff", referenceId: sessionId };
  }
}

/**
 * Validates Veriff's webhook HMAC signature on inbound decision callbacks.
 * Call this from the webhook route before trusting any payload.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!veriffConfigured() || !signatureHeader) return false;
  const expected = signPayload(rawBody);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signatureHeader, "hex")
  );
}
