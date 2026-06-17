"use client";

import { useState } from "react";

type ConsentModalProps = {
  onAccept: () => Promise<void>;
};

export function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!checked || submitting) return;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,13,13,0.45)] px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="w-full max-w-lg rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
      >
        <h2
          id="consent-title"
          className="text-[20px] font-semibold tracking-[-0.02em] text-[#0d0d0d]"
        >
          Data usage consent
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-[#676767]">
          Before you continue, please review how your data is used. By using this
          app, you agree that your conversations, account details, and usage
          activity may be collected, stored, and used for commercial purposes,
          including product improvement, analytics, and related business
          operations.
        </p>
        <p className="mt-3 text-[15px] leading-6 text-[#676767]">
          You must accept this to use ChatGPT Free. If you do not agree, please
          log out.
        </p>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] p-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#0d0d0d]"
          />
          <span className="text-[14px] leading-6 text-[#0d0d0d]">
            I understand and consent to the collection and commercial use of my
            data as described above.
          </span>
        </label>

        {error ? (
          <p className="mt-3 text-[14px] text-[#b42318]">{error}</p>
        ) : null}

        <button
          type="button"
          disabled={!checked || submitting}
          onClick={() => void handleAccept()}
          className="mt-5 w-full rounded-xl bg-[#0d0d0d] px-4 py-3 text-[15px] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Saving..." : "Accept and continue"}
        </button>
      </div>
    </div>
  );
}
