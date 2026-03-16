"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-600">A friendly error message.</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-label="Try again"
      >
        Try again
      </button>
    </div>
  );
}
