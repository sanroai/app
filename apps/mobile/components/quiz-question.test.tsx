import { fireEvent, render, screen } from '@testing-library/react-native';
import { QuizQuestionCard, parseSelectedTexts, type QuizQuestion } from './QuizQuestion';

const options = [
  { id: 'o1', text: 'Rusting of iron', order: 0 },
  { id: 'o2', text: 'Melting of ice', order: 1 },
  { id: 'o3', text: 'Burning of paper', order: 2 },
];

function question(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    id: 'q1',
    text: 'Which of the following is a physical change?',
    type: 'MCQ',
    marks: 1,
    options,
    ...overrides,
  };
}

describe('QuizQuestionCard (single select)', () => {
  it('emits the option text - that is what the API grades', () => {
    const onSelect = jest.fn();
    render(<QuizQuestionCard question={question()} index={0} total={1} selected={null} onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Melting of ice'));
    expect(onSelect).toHaveBeenCalledWith('Melting of ice');
  });

  it('marks the selected option', () => {
    render(<QuizQuestionCard question={question()} index={0} total={1} selected="Melting of ice" onSelect={jest.fn()} />);
    expect(screen.getByText('Melting of ice')).toBeTruthy();
  });

  it('falls back to a single select when the type is missing', () => {
    const onSelect = jest.fn();
    render(
      <QuizQuestionCard
        question={question({ type: undefined })}
        index={0}
        total={1}
        selected={null}
        onSelect={onSelect}
      />,
    );
    fireEvent.press(screen.getByText('Melting of ice'));
    expect(onSelect).toHaveBeenCalledWith('Melting of ice');
  });

  it('falls back to a single select when the type is unknown', () => {
    const onSelect = jest.fn();
    render(
      <QuizQuestionCard
        question={question({ type: 'SOMETHING_NEW' })}
        index={0}
        total={1}
        selected={null}
        onSelect={onSelect}
      />,
    );
    fireEvent.press(screen.getByText('Melting of ice'));
    expect(onSelect).toHaveBeenCalledWith('Melting of ice');
  });
});

describe('QuizQuestionCard (MULTI_SELECT)', () => {
  it('emits a JSON array of the selected option texts', () => {
    const onSelect = jest.fn();
    render(
      <QuizQuestionCard
        question={question({ type: 'MULTI_SELECT' })}
        index={0}
        total={1}
        selected={null}
        onSelect={onSelect}
      />,
    );
    fireEvent.press(screen.getByText('Melting of ice'));
    expect(onSelect).toHaveBeenCalledWith(JSON.stringify(['Melting of ice']));
  });

  it('keeps every picked option in the emitted array', () => {
    const onSelect = jest.fn();
    render(
      <QuizQuestionCard
        question={question({ type: 'MULTI_SELECT' })}
        index={0}
        total={1}
        selected={null}
        onSelect={onSelect}
      />,
    );
    fireEvent.press(screen.getByText('Melting of ice'));
    fireEvent.press(screen.getByText('Burning of paper'));
    expect(onSelect).toHaveBeenLastCalledWith(JSON.stringify(['Melting of ice', 'Burning of paper']));
  });

  it('removes an option that is toggled off', () => {
    const onSelect = jest.fn();
    render(
      <QuizQuestionCard
        question={question({ type: 'MULTI_SELECT' })}
        index={0}
        total={1}
        selected={JSON.stringify(['Melting of ice', 'Burning of paper'])}
        onSelect={onSelect}
      />,
    );
    fireEvent.press(screen.getByText('Burning of paper'));
    expect(onSelect).toHaveBeenCalledWith(JSON.stringify(['Melting of ice']));
  });

  it('shows the already selected options as selected', () => {
    render(
      <QuizQuestionCard
        question={question({ type: 'MULTI_SELECT' })}
        index={0}
        total={1}
        selected={JSON.stringify(['Melting of ice'])}
        onSelect={jest.fn()}
      />,
    );
    // the toggle list keeps the selection, it is not a radio button
    expect(screen.getByText('Select all that apply')).toBeTruthy();
  });

  it('can be forced into the toggle list when the type is missing', () => {
    const onSelect = jest.fn();
    render(
      <QuizQuestionCard
        question={question({ type: undefined })}
        index={0}
        total={1}
        selected={null}
        onSelect={onSelect}
        multiSelect
      />,
    );
    fireEvent.press(screen.getByText('Melting of ice'));
    expect(onSelect).toHaveBeenCalledWith(JSON.stringify(['Melting of ice']));
  });
});

describe('parseSelectedTexts (the MULTI_SELECT answer value)', () => {
  it('reads the option texts out of the JSON array', () => {
    expect(parseSelectedTexts(JSON.stringify(['a', 'b']))).toEqual(['a', 'b']);
  });

  it('yields nothing for a single-select answer', () => {
    expect(parseSelectedTexts('Melting of ice')).toEqual([]);
  });

  it('yields nothing for a broken value', () => {
    expect(parseSelectedTexts('["a",')).toEqual([]);
    expect(parseSelectedTexts(null)).toEqual([]);
    expect(parseSelectedTexts('')).toEqual([]);
  });
});
