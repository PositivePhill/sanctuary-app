"use client";

export function LogoutButton() {
  async function handleLogout() {
    const csrfRes = await fetch("/api/csrf");
    const { token } = await csrfRes.json();
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "x-csrf-token": token },
      credentials: "same-origin",
    });
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-slate-600 hover:text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
    >
      Logout
    </button>
  );
}
