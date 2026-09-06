import Link from 'next/link';
import { MyBoardsDashboard } from '@/components/my-boards-dashboard';

export default function MyBoardsPage() {
  return (
    <main>
      <nav aria-label="Primary navigation">
        <Link className="brand" href="/">
          Trivia Friends
        </Link>
        <Link className="nav-link" href="/">
          Public boards
        </Link>
      </nav>
      <MyBoardsDashboard />
    </main>
  );
}
