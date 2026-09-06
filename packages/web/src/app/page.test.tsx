import { render, screen } from '@testing-library/react';
import HomePage from './page';

jest.mock('@/components/account-panel', () => ({
  AccountPanel: () => <div>Account controls</div>,
}));

jest.mock('@/components/public-board-list', () => ({
  PublicBoardList: () => <div>Public board results</div>,
}));

describe('HomePage', () => {
  it('introduces public board discovery', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        name: 'Pick a board. Bring the competition.',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Ready for game night' })
    ).toBeInTheDocument();
    expect(screen.getByText('Public board results')).toBeInTheDocument();
    expect(screen.getByText('Account controls')).toBeInTheDocument();
  });
});
