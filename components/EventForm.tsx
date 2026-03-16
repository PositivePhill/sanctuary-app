"use client";

import { useState } from "react";

export function EventForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({
          title,
          description,
          eventDate: new Date(eventDate).toISOString(),
          location,
        }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok) {
        const err = typeof data.error === "object" ? Object.values(data.error).flat().join(" ") : data.error;
        setError(err ?? "Failed to create event");
        return;
      }

      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
      onSuccess?.();
      window.location.href = "/events";
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Event</h2>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="event-title" className="block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label htmlFor="event-description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label htmlFor="event-date" className="block text-sm font-medium text-slate-700">
            Event Date
          </label>
          <input
            id="event-date"
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-slate-700">
            Location
          </label>
          <input
            id="event-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}
