"use client";

import { useEffect, useState, type ReactNode } from "react";

const statusMessageDurationMs = 4000;

export function TemporaryStatusMessage({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, statusMessageDurationMs);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="sl-alert sl-alert-success" role="status">
      {children}
    </div>
  );
}
