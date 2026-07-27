"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/analytics/client";
import { getDeviceType, resolveRoutePattern } from "@/analytics/events";
import { messages, type Locale } from "@/i18n/messages";

interface ShareLinkButtonProps {
  readonly locale: Locale;
  readonly path: string;
  readonly source: "event" | "results";
}

export function ShareLinkButton({
  locale,
  path,
  source,
}: ShareLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const t = messages[locale].event.share;

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyLink() {
    const url = new URL(path, window.location.origin).toString();

    trackEvent({
      name: "share.clicked",
      properties: {
        device_type: getDeviceType(window.innerWidth),
        locale,
        route_pattern: resolveRoutePattern(window.location.pathname),
        source,
      },
    });

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
        className="sl-button sl-button-primary"
        onClick={copyLink}
        type="button"
      >
        {t.button}
      </button>
      <p
        aria-live="polite"
        className="min-h-4 text-center text-xs text-[var(--muted)] sm:text-right"
      >
        {status === "copied" ? t.copied : ""}
        {status === "failed" ? t.failed : ""}
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
