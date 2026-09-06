import { AccountPanel } from '@/components/account-panel';
import { PublicBoardList } from '@/components/public-board-list';

export default function HomePage() {
  return (
    <main>
      <nav aria-label="Primary navigation">
        <a className="brand" href="/">
          Trivia Friends
        </a>
        <a className="nav-link" href="#public-boards">
          Browse boards
        </a>
      </nav>

      <section className="hero hero--compact">
        <div className="hero-copy">
          <p className="eyebrow">The couch is your studio</p>
          <h1>Pick a board. Bring the competition.</h1>
          <p className="lede">
            Browse community-made trivia boards, preview every category, and
            choose the perfect game for your room.
          </p>
          <a className="button hero-action" href="#public-boards">
            Find a board
          </a>
        </div>
        <AccountPanel />
      </section>

      <section className="board-library" id="public-boards">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Public boards</p>
            <h2>Ready for game night</h2>
          </div>
          <p>Prompts and answers stay hidden until the game begins.</p>
        </div>
        <PublicBoardList />
      </section>
    </main>
  );
}
