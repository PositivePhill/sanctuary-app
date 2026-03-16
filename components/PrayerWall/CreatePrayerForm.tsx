"use client";

import { useState } from "react";

export function CreatePrayerForm({ onSuccess }: { onSuccess?: () => void }) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ content, isAnonymous }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok) {
        const err = typeof data.error === "object" ? Object.values(data.error).flat().join(" ") : data.error;
        setError(err ?? "Failed to post prayer");
        return;
      }

      setContent("");
      setIsAnonymous(false);
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Share a prayer request</h2>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm" role="status">
          Prayer shared successfully!
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={4}
        placeholder="Share your prayer request..."
        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      />
      <div className="mt-4 flex items-center justify-between">
        <label htmlFor="isAnonymous" className="flex items-center gap-2 cursor-pointer">
          <input
            id="isAnonymous"
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-sm text-slate-700">Post anonymously</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
