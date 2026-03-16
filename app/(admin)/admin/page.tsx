import { DevotionalForm } from "@/components/DevotionalForm";
import { EventForm } from "@/components/EventForm";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Admin</h1>

      <section aria-labelledby="devotionals-heading">
        <h2 id="devotionals-heading" className="text-lg font-medium text-slate-800 mb-4">
          Devotionals
        </h2>
        <DevotionalForm />
      </section>

      <section aria-labelledby="events-heading">
        <h2 id="events-heading" className="text-lg font-medium text-slate-800 mb-4">
          Events
        </h2>
        <EventForm />
      </section>
    </div>
  );
}
