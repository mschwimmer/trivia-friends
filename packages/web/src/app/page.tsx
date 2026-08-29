import { ApiHealth } from '@/components/api-health';
import { AccountPanel } from '@/components/account-panel';

export default function HomePage() {
  return (
    <main>
      <nav aria-label="Primary navigation">
        <a className="brand" href="/">
          Trivia Friends
        </a>
        <span className="eyebrow">v1 foundation</span>
      </nav>

      <section className="hero">
        <p className="eyebrow">
          Your room. Your questions. Fastest finger wins.
        </p>
        <h1>A trivia night built for the friends already on your couch.</h1>
        <p className="lede">
          Create Jeopardy-style boards, keep score, and let everyone buzz in
          from their phone.
        </p>

        <ApiHealth />
        <AccountPanel />
      </section>
    </main>
  );
}
