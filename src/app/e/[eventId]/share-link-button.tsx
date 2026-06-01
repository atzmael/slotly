"use client";

import { useEffect, useState } from "react";

interface ShareLinkButtonProps {
  readonly path: string;
}

export function ShareLinkButton({ path }: ShareLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyLink() {
    const url = new URL(path, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus(copyWithFallback(url) ? "copied" : "failed");
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center text-sm font-medium transition hover:border-[var(--primary)]"
        onClick={copyLink}
        type="button"
      >
        Share link
      </button>
      <p
        aria-live="polite"
        className="min-h-4 text-center text-xs text-[var(--muted)] sm:text-right"
      >
        {status === "copied" ? "Link copied" : ""}
        {status === "failed" ? "Copy failed" : ""}
      </p>
    </div>
  );
}

function copyWithFallback(value: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
