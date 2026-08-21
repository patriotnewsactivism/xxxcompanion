export type VerificationStatus = "pending" | "verified" | "rejected";

export interface VerificationResult {
  status: VerificationStatus;
  provider: string;
  referenceId?: string;
}

export async function initiateIdentityVerification(
  userId: number
): Promise<VerificationResult> {
  const provider = process.env.IDENTITY_VERIFICATION_PROVIDER ?? "stub-verifier";
  return { status: "pending", provider, referenceId: `idv-${userId}` };
}

export async function confirmIdentityVerification(
  userId: number
): Promise<VerificationResult> {
  const provider = process.env.IDENTITY_VERIFICATION_PROVIDER ?? "stub-verifier";
  return { status: "verified", provider, referenceId: `idv-${userId}` };
}