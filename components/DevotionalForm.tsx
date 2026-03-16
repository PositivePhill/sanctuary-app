"use client";

import { useState } from "react";

export function DevotionalForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [scriptureReference, setScriptureReference] = useState("");
  const [content, setContent] = useState("");
  const [publishDate, setPublishDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch("/api/devotionals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({
          title,
          scriptureReference,
          content,
          publishDate: new Date(publishDate).toISOString(),
        }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok) {
        const err = typeof data.error === "object" ? Object.values(data.error).flat().join(" ") : data.error;
        setError(err ?? "Failed to create devotional");
        return;
      }

      setTitle("");
      setScriptureReference("");
      setContent("");
      setPublishDate(new Date().toISOString().slice(0, 16));
      onSuccess?.();
      window.location.href = "/devotionals";
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Devotional</h2>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label htmlFor="scriptureReference" className="block text-sm font-medium text-slate-700">
            Scripture Reference
          </label>
          <input
            id="scriptureReference"
            type="text"
            value={scriptureReference}
            onChange={(e) => setScriptureReference(e.target.value)}
            required
            placeholder="e.g. John 3:16"
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label htmlFor="publishDate" className="block text-sm font-medium text-slate-700">
            Publish Date
          </label>
          <input
            id="publishDate"
            type="datetime-local"
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-slate-700">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {loading ? "Creating..." : "Create Devotional"}
        </button>
      </div>
    </form>
  );
}
