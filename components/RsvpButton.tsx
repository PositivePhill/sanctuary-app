"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function RsvpButton({
  eventId,
  hasRsvpd,
  onUpdate,
}: {
  eventId: string;
  hasRsvpd: boolean;
  onUpdate?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRsvp() {
    if (hasRsvpd) return;
    setError(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "x-csrf-token": token },
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to RSVP");
        return;
      }

      onUpdate?.();
      window.location.reload();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (hasRsvpd) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-xl">
        <Check className="w-4 h-4" aria-hidden />
        You&apos;re going
      </span>
    );
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 mb-2" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleRsvp}
        disabled={loading}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      >
        {loading ? "RSVPing..." : "RSVP"}
      </button>
    </div>
  );
}
