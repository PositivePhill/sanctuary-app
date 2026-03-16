"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/Avatar";

const AVATAR_OPTIONS = [
  { value: "amber", label: "Amber", bg: "bg-amber-500" },
  { value: "blue", label: "Blue", bg: "bg-blue-500" },
  { value: "rose", label: "Rose", bg: "bg-rose-500" },
  { value: "emerald", label: "Emerald", bg: "bg-emerald-500" },
  { value: "violet", label: "Violet", bg: "bg-violet-500" },
] as const;

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [avatarStyle, setAvatarStyle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name ?? "");
          setAvatarStyle(data.user.avatarStyle ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ name: name.trim(), avatarStyle }),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.name?.[0] ?? data.error ?? "Failed to update");
        return;
      }
      setSuccess(true);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">
          Profile Settings
        </h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        Profile Settings
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-md p-6 max-w-md"
      >
        {error && (
          <div
            className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm"
            role="status"
          >
            Profile updated!
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <Avatar name={name || "?"} style={avatarStyle} size="lg" />
          <div>
            <p className="text-sm font-medium text-slate-700">Avatar preview</p>
            <p className="text-xs text-slate-500">
              Choose a color below
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
            Display name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Avatar color
          </label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setAvatarStyle(avatarStyle === opt.value ? null : opt.value)
                }
                aria-pressed={avatarStyle === opt.value}
                aria-label={`Avatar color ${opt.label}`}
                className={`w-10 h-10 rounded-full ${opt.bg} transition-opacity focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                  avatarStyle === opt.value ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-70 hover:opacity-100"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your avatar shows your initials. Pick a color or leave default.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
