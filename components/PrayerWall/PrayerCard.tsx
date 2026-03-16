"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle2, User, Sparkles } from "lucide-react";

const REACTION_SPEC_PRAYER = {
  PRAYING: { emoji: "❤️", label: "Praying" },
  AMEN: { emoji: "🙏", label: "Amen" },
  PRAISE: { emoji: "✨", label: "Praise" },
} as const;

const REACTION_SPEC_PRAISE = {
  PRAYING: { emoji: "❤️", label: "Amen" },
  AMEN: { emoji: "🙌", label: "Hallelujah" },
  PRAISE: { emoji: "✨", label: "Praise" },
} as const;

type Prayer = {
  id: string;
  content: string;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  updatedAt?: string;
  author: { id: string | null; name: string };
  isAuthor: boolean;
  reactionCounts?: { PRAYING: number; AMEN: number; PRAISE: number };
  myReactions?: { PRAYING: boolean; AMEN: boolean; PRAISE: boolean };
  comments: { id: string; content: string; createdAt: string; author: { id: string; name: string } }[];
};

export function PrayerCard({
  prayer,
  onUpdate,
  variant = "default",
  canReact = false,
}: {
  prayer: Prayer;
  onUpdate?: () => void;
  variant?: "default" | "praise";
  canReact?: boolean;
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactionLoading, setReactionLoading] = useState<string | null>(null);
  const [localCounts, setLocalCounts] = useState(prayer.reactionCounts ?? { PRAYING: 0, AMEN: 0, PRAISE: 0 });
  const [localMine, setLocalMine] = useState(prayer.myReactions ?? { PRAYING: false, AMEN: false, PRAISE: false });

  const isAuthor = prayer.isAuthor;

  async function handleReaction(type: "PRAYING" | "AMEN" | "PRAISE") {
    if (!canReact) return;
    setReactionLoading(type);
    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();
      const res = await fetch(`/api/prayers/${prayer.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ type }),
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const wasMine = localMine[type];
      setLocalMine((m) => ({ ...m, [type]: !wasMine }));
      setLocalCounts((c) => ({ ...c, [type]: c[type] + (wasMine ? -1 : 1) }));
      onUpdate?.();
    } finally {
      setReactionLoading(null);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ prayerRequestId: prayer.id, content: comment.trim() }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.content?.[0] ?? data.error ?? "Failed to add comment");
        return;
      }

      setComment("");
      onUpdate?.();
      window.location.reload();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAnswered() {
    setLoading(true);
    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch(`/api/prayers/${prayer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ status: "ANSWERED" }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update");
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

  const showPraiseBadge = variant === "praise" || prayer.status === "ANSWERED";
  const reactionSpec = variant === "praise" ? REACTION_SPEC_PRAISE : REACTION_SPEC_PRAYER;

  return (
    <article
      className={`rounded-2xl shadow-md p-6 mb-6 ${
        variant === "praise"
          ? "bg-gradient-to-b from-amber-50 to-amber-50/30 ring-2 ring-amber-400/50 border border-amber-200/80"
          : prayer.status === "ANSWERED"
            ? "bg-white ring-2 ring-amber-400/50 border-amber-200"
            : "bg-white"
      }`}
    >
      {showPraiseBadge && (
        <div
          className={`flex items-center gap-2 mb-2 ${variant === "praise" ? "text-amber-700" : "text-amber-600"}`}
          aria-live="polite"
        >
          {variant === "praise" ? (
            <>
              <Sparkles className="w-5 h-5" aria-hidden />
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-200/90 text-amber-900"
                aria-label="Praise report"
              >
                Praise Report
              </span>
              <span className="text-xs text-amber-600/90 font-normal ml-1">
                Community praise report
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" aria-hidden />
              <span className="font-medium text-sm">Answered</span>
            </>
          )}
        </div>
      )}
      {variant === "praise" && prayer.updatedAt && (
        <p className="text-xs text-amber-700/80 mb-3">
          Answered on{" "}
          {new Date(prayer.updatedAt).toLocaleDateString(undefined, {
            dateStyle: "medium",
          })}
        </p>
      )}

      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"
          aria-hidden
        >
          <User className="w-5 h-5 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">{prayer.author.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(prayer.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      <p className="mt-4 text-slate-700 whitespace-pre-wrap">{prayer.content}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(reactionSpec) as Array<keyof typeof reactionSpec>).map((type) => {
          const { emoji, label } = reactionSpec[type];
          const count = localCounts[type];
          const isMine = localMine[type];
          const disabled = !canReact || reactionLoading !== null;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleReaction(type)}
              disabled={disabled}
              aria-pressed={isMine}
              aria-label={`${label} ${count > 0 ? `(${count})` : ""} ${isMine ? "— remove" : "— add"}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                isMine
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span aria-hidden>{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>

      {isAuthor && prayer.status === "ACTIVE" && variant !== "praise" && (
        <button
          type="button"
          onClick={handleMarkAnswered}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-xl hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark as Answered
        </button>
      )}

      <div className="mt-6 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Comments ({prayer.comments.length})
        </h3>

        {prayer.comments.length > 0 && (
          <ul className="space-y-3 mb-4">
            {prayer.comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.author.name}</p>
                  <p className="text-sm text-slate-600">{c.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddComment}>
          {error && (
            <p className="text-sm text-red-600 mb-2" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !comment.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Comment
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}
