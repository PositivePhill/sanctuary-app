"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { Avatar } from "@/components/Avatar";

export function AppNav({
  userName,
  userRole,
  userAvatarStyle,
}: {
  userName: string;
  userRole: string;
  userAvatarStyle?: string | null;
}) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || (path !== "/dashboard" && pathname.startsWith(path + "/"));
  const linkClass = (path: string) =>
    isActive(path)
      ? "text-amber-600 font-semibold"
      : "text-slate-900 hover:text-amber-600";

  return (
    <nav className="max-w-4xl mx-auto px-4 py-4 flex gap-4 items-center flex-wrap">
      <Link href="/dashboard" className={linkClass("/dashboard")}>
        Dashboard
      </Link>
      <Link href="/prayers" className={linkClass("/prayers")}>
        Prayer Wall
      </Link>
      <Link href="/praise" className={linkClass("/praise")}>
        Praise Wall
      </Link>
      <Link href="/devotionals" className={linkClass("/devotionals")}>
        Devotionals
      </Link>
      <Link href="/events" className={linkClass("/events")}>
        Events
      </Link>
      {userRole === "ADMIN" && (
        <Link href="/admin" className={linkClass("/admin")}>
          Admin
        </Link>
      )}
      <Link href="/settings" className={linkClass("/settings")}>
        Settings
      </Link>
      <span className="ml-auto flex items-center gap-3">
        <Avatar name={userName} style={userAvatarStyle} size="sm" />
        <span className="text-slate-600 text-sm">{userName}</span>
        <span
          className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800"
          aria-label={`Role: ${userRole}`}
        >
          {userRole}
        </span>
      </span>
      <LogoutButton />
    </nav>
  );
}
