import Link from 'next/link';
import { BoardPreview } from '@/components/board-preview';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <nav aria-label="Primary navigation">
        <Link className="brand" href="/">
          Trivia Friends
        </Link>
        <Link className="nav-link" href="/#public-boards">
          All boards
        </Link>
      </nav>
      <BoardPreview boardId={id} />
    </main>
  );
}
