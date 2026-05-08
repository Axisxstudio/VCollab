export default function HomePage() {
  return (
    <main className="shell">
      <section className="panel" aria-labelledby="migration-title">
        <p className="eyebrow">VCollab Next</p>
        <h1 id="migration-title">VCollab Next API</h1>
        <p>
          The VCollab backend now runs on Next.js route handlers with Supabase
          for auth, database, storage, and realtime integrations.
        </p>
      </section>
    </main>
  );
}
