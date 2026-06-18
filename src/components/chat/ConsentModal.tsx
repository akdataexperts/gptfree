"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { handleSignOut } from "@/app/auth/actions";

const CONSENT_FEATURES = [
  "Conversations are anonymized before use",
  "Used for research & marketing insight",
  "GDPR & CCPA compliant - delete anytime",
];

type ConsentModalProps = {
  onAccept: () => Promise<void>;
};

export function ConsentModal({ onAccept }: ConsentModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (submitting || declining) return;

    setSubmitting(true);
    setError(null);

    try {
      await onAccept();
    } catch (acceptError) {
      const message =
        acceptError instanceof Error
          ? acceptError.message
          : "Failed to save consent";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    if (submitting || declining) return;

    setDeclining(true);
    void handleSignOut();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,8,20,0.88)] px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="w-full max-w-[480px] rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#111122] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(99,102,241,0.18)]">
          <ShieldCheck className="h-5 w-5 text-[#a5b4fc]" strokeWidth={1.75} />
        </div>

        <h2
          id="consent-title"
          className="text-[26px] font-semibold tracking-[-0.02em] text-white"
        >
          Before you start chatting
        </h2>

        <p className="mt-4 text-[15px] leading-[1.65] text-[#9ca3af]">
          GPT Free is free because your conversations help fund AI research. By
          continuing, you agree that your prompts may be collected, anonymized,
          and used for{" "}
          <span className="font-semibold text-white">
            research and marketing purposes.
          </span>
        </p>

        <ul className="mt-5 space-y-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
          {CONSENT_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[#818cf8]"
                strokeWidth={2.25}
              />
              <span className="text-[14px] leading-6 text-[#9ca3af]">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {error ? (
          <p className="mt-4 text-[14px] text-[#fca5a5]">{error}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={submitting || declining}
            onClick={handleDecline}
            className="shrink-0 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#111122] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:border-[rgba(255,255,255,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {declining ? "Signing out..." : "Decline"}
          </button>
          <button
            type="button"
            disabled={submitting || declining}
            onClick={() => void handleAccept()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6366f1] px-5 py-3 text-[15px] font-semibold text-white transition-opacity hover:bg-[#5558e3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Agree & continue"}
            {!submitting ? (
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            ) : null}
          </button>
        </div>

        <p className="mt-5 text-center text-[13px] leading-5 text-[#6b7280]">
          By continuing you accept our{" "}
          <a
            href="https://getaiso.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9ca3af] underline underline-offset-2 transition-colors hover:text-white"
          >
            Privacy Policy
          </a>{" "}
          and data use terms.
        </p>
      </div>
    </div>
  );
}
