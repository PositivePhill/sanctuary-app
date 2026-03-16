"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ name, email, password }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok) {
        const err = typeof data.error === "object" ? Object.values(data.error).flat().join(" ") : data.error;
        setError(err ?? "Signup failed");
        return;
      }

      window.location.href = "/login";
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Sign up</h1>
      <p className="mt-1 text-slate-600">Create your account</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div
            className="p-3 rounded-xl bg-red-50 text-red-700 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-600 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
