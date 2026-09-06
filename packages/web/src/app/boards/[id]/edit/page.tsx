import Link from 'next/link';
import { BoardEditor } from '@/components/board-editor';

export default async function EditBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="editor-main">
      <nav aria-label="Primary navigation">
        <Link className="brand" href="/">
          Trivia Friends
        </Link>
        <Link className="nav-link" href="/boards">
          My boards
        </Link>
      </nav>
      <BoardEditor boardId={id} />
    </main>
  );
}
