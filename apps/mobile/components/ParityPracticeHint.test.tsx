import { render, screen } from '@testing-library/react-native';
import { ParityPracticeHint, NO_PRACTICE_QUESTIONS_HINT } from './ParityPracticeHint';

describe('ParityPracticeHint', () => {
  it('uses the exact sentence the web shows', () => {
    expect(NO_PRACTICE_QUESTIONS_HINT).toBe(
      'No practice questions yet — take a test to unlock practice.',
    );
  });

  it('renders the hint', () => {
    render(<ParityPracticeHint />);
    expect(screen.getByText(NO_PRACTICE_QUESTIONS_HINT)).toBeTruthy();
  });

  it('can render a custom message', () => {
    render(<ParityPracticeHint message="No practice questions for this chapter yet" />);
    expect(screen.getByText('No practice questions for this chapter yet')).toBeTruthy();
  });
});
