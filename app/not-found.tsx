import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        Go home
      </Link>
    </div>
  );
}
