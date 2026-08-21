export const metadata = {
  title: "Privacy Policy — Companion",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-relaxed text-white/80">
      <h1 className="mb-6 text-2xl font-semibold text-white">Privacy Policy</h1>

      <p className="mb-4 text-white/60">
        Last updated: {new Date().toISOString().slice(0, 10)}. Placeholder
        draft — have this reviewed by an attorney before public launch.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-white">1. What We Collect</h2>
      <p className="mb-4">
        Account and age-verification status; conversation history and
        preferences used to power persona memory; payment and billing
        metadata processed by our payment provider (we do not store full
        card numbers); technical logs, including security events generated
        by our content moderation system.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-white">2. Age &amp; Identity Verification</h2>
      <p className="mb-4">
        We use a third-party identity verification provider to confirm you
        are a verified adult before granting access. Verification data is
        processed by that provider under its own privacy policy; we retain
        only the verification result and status, not the underlying
        identity documents.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-white">3. Content Moderation &amp; Security Logging</h2>
      <p className="mb-4">
        Every message you send is automatically screened by an automated
        safety system before and after AI processing. Messages that trigger
        a policy violation (including any reference to minors in a sexual
        context, or non-consensual content) are logged as a security event,
        which may include a truncated excerpt of the triggering message,
        for safety, compliance, and law-enforcement-cooperation purposes.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-white">4. How We Use Your Data</h2>
      <p className="mb-4">
        To provide and improve the service, enforce these policies, process
        payments, and comply with legal obligations. We do not sell your
        personal data.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-white">5. Data Retention &amp; Deletion</h2>
      <p className="mb-4">
        You may request deletion of your account and associated conversation
        history at any time via the support contact listed on the platform,
        subject to retention required for security/legal compliance records.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-white">6. Contact</h2>
      <p className="mb-4">
        Questions about this Privacy Policy can be sent to the support
        address listed on the platform.
      </p>
    </main>
  );
}
