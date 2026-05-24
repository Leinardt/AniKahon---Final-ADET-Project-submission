import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AniKahon branding link', () => {
  render(<App />);
  const linkElement = screen.getAllByText(/AniKahon/i)[0];
  expect(linkElement).toBeInTheDocument();
});

