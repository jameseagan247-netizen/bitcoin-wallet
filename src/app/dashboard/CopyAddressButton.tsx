"use client";

import { useState } from "react";

type CopyAddressButtonProps = {
  address: string;
};

export default function CopyAddressButton({
  address,
}: CopyAddressButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-orange-400 hover:text-orange-400"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}