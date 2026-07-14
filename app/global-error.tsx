"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#f6ece1", color: "#211a13", fontFamily: "Georgia, serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: "24rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              PersonalOS hit an unexpected error
            </h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", opacity: 0.6, fontFamily: "sans-serif" }}>
              Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                background: "#211a13",
                color: "#f6ece1",
                fontSize: "0.875rem",
                fontFamily: "sans-serif",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
