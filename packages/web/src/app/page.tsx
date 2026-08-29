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
          Exciting words that make you release dopamine so you&apos;re hooked on
          my product
        </p>
        <h1>Legally distinct jeopardy game with friends</h1>
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
