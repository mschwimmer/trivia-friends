import { render, screen } from '@testing-library/react';
import HomePage from './page';

jest.mock('@/components/api-health', () => ({
  ApiHealth: () => <div>API status</div>,
}));

jest.mock('@/components/account-panel', () => ({
  AccountPanel: () => <div>Account controls</div>,
}));

describe('HomePage', () => {
  it('introduces the local trivia experience', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        name: 'Legally distinct jeopardy game with friends',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('API status')).toBeInTheDocument();
    expect(screen.getByText('Account controls')).toBeInTheDocument();
  });
});
